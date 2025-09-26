// Google Maps API type definitions
declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element | null, opts?: unknown);
    }

    namespace places {
      class AutocompleteService {
        getPlacePredictions(
          request: { input: string; types: string[] },
          callback: (predictions: PlacePrediction[] | null, status: PlacesServiceStatus) => void
        ): void;
      }

      class PlacesService {
        constructor(attrContainer: Element | Map);
        getDetails(
          request: PlaceDetailsRequest,
          callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void
        ): void;
      }

      interface PlacePrediction {
        description: string;
        place_id: string;
      }

      interface PlaceDetailsRequest {
        placeId: string;
        fields: string[];
      }

      interface PlaceResult {
        geometry: {
          location: {
            lat(): number;
            lng(): number;
          };
        };
        address_components: AddressComponent[];
        name: string;
      }

      interface AddressComponent {
        long_name: string;
        short_name: string;
        types: string[];
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        INVALID_REQUEST = 'INVALID_REQUEST',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR'
      }
    }
  }
}

declare const google: typeof google;

// Extend Window interface to include google
declare global {
  interface Window {
    google: typeof google;
  }
}

