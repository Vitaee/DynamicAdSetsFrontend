import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type PlacePrediction = {
  description: string;
  place_id: string;
};

type ResolvedPlace = {
  place_id: string;
  description: string;
  lat: number;
  lng: number;
  city?: string;
  country?: string;
};

function loadGooglePlaces(apiKey?: string): Promise<typeof google | null> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      resolve(window.google);
      return;
    }
    if (!apiKey) {
      resolve(null);
      return;
    }
    const scriptId = 'google-maps-places';
    if (document.getElementById(scriptId)) {
      const check = () => window.google?.maps?.places ? resolve(window.google) : setTimeout(check, 100);
      check();
      return;
    }
    const s = document.createElement('script');
    s.id = scriptId;
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    s.onload = () => resolve(window.google || null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

export function useGooglePlaces() {
  const [ready, setReady] = useState(false);
  const googleRef = useRef<typeof google | null>(null);
  const apiKey = useMemo(() => {
    return (
      import.meta.env?.VITE_GOOGLE_PLACES_API_KEY ||
      import.meta.env?.GOOGLE_PLACES_API_KEY ||
      (window as { __GOOGLE_PLACES_API_KEY?: string }).__GOOGLE_PLACES_API_KEY ||
      undefined
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    loadGooglePlaces(apiKey).then((g) => {
      if (!mounted) return;
      googleRef.current = g;
      setReady(!!g);
    });
    return () => {
      mounted = false;
    };
  }, [apiKey]);

  const getPredictions = useCallback((input: string): Promise<PlacePrediction[]> => {
    if (!ready || !googleRef.current) return Promise.resolve([]);
    const svc = new googleRef.current.maps.places.AutocompleteService();
    return new Promise((resolve) => {
      try {
        svc.getPlacePredictions({ input, types: ['(regions)'] }, (preds: google.maps.places.PlacePrediction[] | null) => {
          resolve((preds || []).map((p: google.maps.places.PlacePrediction) => ({ description: p.description, place_id: p.place_id })));
        });
      } catch {
        resolve([]);
      }
    });
  }, [ready]);

  const resolvePlace = useCallback((place_id: string): Promise<ResolvedPlace | null> => {
    if (!ready || !googleRef.current) return Promise.resolve(null);
    const map = document.createElement('div');
    const svc = new googleRef.current.maps.places.PlacesService(map);
    return new Promise((resolve) => {
      try {
        svc.getDetails({ placeId: place_id, fields: ['geometry.location', 'address_components', 'name'] }, (res: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
          if (!res || status !== googleRef.current!.maps.places.PlacesServiceStatus.OK) {
            resolve(null);
            return;
          }
          const loc = res.geometry?.location;
          const comps = res.address_components || [];
          const city = comps.find((c: google.maps.places.AddressComponent) => c.types.includes('locality'))?.long_name;
          const country = comps.find((c: google.maps.places.AddressComponent) => c.types.includes('country'))?.short_name;
          resolve({
            place_id,
            description: res.name,
            lat: loc?.lat?.() ?? 0,
            lng: loc?.lng?.() ?? 0,
            city,
            country,
          });
        });
      } catch {
        resolve(null);
      }
    });
  }, [ready]);

  // Soft warning migration note – use new Suggestion API if available in future
  // We intentionally keep AutocompleteService for backward compatibility.
  return { ready, getPredictions, resolvePlace };
}

export type { PlacePrediction, ResolvedPlace };
