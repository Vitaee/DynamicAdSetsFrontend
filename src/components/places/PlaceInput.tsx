import { useEffect, useRef, useState } from 'react';
import Input from '../ui/Input';
import Portal from '../ui/Portal';
import { useGooglePlaces, type PlacePrediction, type ResolvedPlace } from '../../hooks/useGooglePlaces';

type Props = {
  placeholder?: string;
  value?: string;
  onSelect: (place: ResolvedPlace) => void;
};

export default function PlaceInput({ placeholder = 'City, Country', value, onSelect }: Props) {
  const { ready, getPredictions, resolvePlace } = useGooglePlaces();
  const [query, setQuery] = useState(value || '');
  const [preds, setPreds] = useState<PlacePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || !ready) {
      setPreds([]);
      return;
    }
    let active = true;
    const id = setTimeout(() => {
      getPredictions(query).then((p) => {
        if (!active) return;
        // Avoid state churn: only update if changed
        setPreds((prev) => {
          if (prev.length === p.length && prev.every((x, i) => x.place_id === p[i].place_id)) return prev;
          return p;
        });
      });
    }, 250);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [query, ready, getPredictions]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      const insideInput = !!boxRef.current && boxRef.current.contains(t);
      const insideMenu = !!menuRef.current && menuRef.current.contains(t);
      if (!insideInput && !insideMenu) setOpen(false);
    };
    const recalc = () => {
      if (!inputRef.current) return;
      const r = inputRef.current.getBoundingClientRect();
      setMenuRect({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    recalc();
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, []);

  // Keyboard navigation
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min((i ?? -1) + 1, preds.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max((i ?? preds.length) - 1, 0));
    } else if (e.key === 'Enter') {
      const p = preds[activeIndex];
      if (p) {
        e.preventDefault();
        pick(p);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const pick = async (p: PlacePrediction) => {
    const resolved = await resolvePlace(p.place_id);
    if (resolved) {
      setQuery(resolved.description);
      setOpen(false);
      onSelect(resolved);
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <Input
        placeholder={placeholder}
        value={query}
        onFocus={() => {
          setOpen(true);
          if (inputRef.current) {
            const r = inputRef.current.getBoundingClientRect();
            setMenuRect({ top: r.bottom + 4, left: r.left, width: r.width });
          }
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        ref={inputRef}
      />
      {open && preds.length > 0 && menuRect && (
        <Portal>
          <div
            style={{ position: 'fixed', top: menuRect.top, left: menuRect.left, width: menuRect.width }}
            className="z-[10000] max-h-[50vh] overflow-auto rounded-xl bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800"
            ref={menuRef}
          >
            {preds.map((p, idx) => (
              <button
                key={p.place_id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  pick(p);
                }}
                className={
                  'block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ' +
                  (idx === activeIndex ? 'bg-gray-50 dark:bg-gray-800' : '')
                }
              >
                {p.description}
              </button>
            ))}
          </div>
        </Portal>
      )}
    </div>
  );
}
