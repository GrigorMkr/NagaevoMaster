import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { searchAddresses, type AddressSearchResult } from '@/services/geoApi';
import { getErrorMessage } from '@/utils/errorMessage';
import pageStyles from '@/styles/page.module.css';
import styles from './AddressSearchField.module.css';

interface AddressSearchFieldProps {
  settlement: string;
  near?: { lat: number; lng: number };
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressSearchResult) => void;
  placeholder?: string;
}

function AddressSearchField({
  settlement,
  near,
  value,
  onChange,
  onSelect,
  placeholder = 'Улица и номер дома, например Ленина 12',
}: AddressSearchFieldProps) {
  const listId = useId();
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3) {
      setResults([]);
      setOpen(false);
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void searchAddresses(query, settlement || undefined, near)
        .then((items) => {
          setResults(items);
          setOpen(items.length > 0);
        })
        .catch((err) => {
          setResults([]);
          setOpen(false);
          setError(getErrorMessage(err, 'Не удалось найти адрес'));
        })
        .finally(() => setLoading(false));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [near, settlement, value]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
    setOpen(true);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        className={pageStyles.input}
        value={value}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="street-address"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
      />
      {loading && <p className={styles.status}>Поиск адресов…</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && value.trim().length >= 3 && results.length === 0 && open && (
        <p className={styles.status}>Адрес не найден — уточните запрос или укажите точку на карте</p>
      )}
      {open && results.length > 0 && (
        <ul id={listId} className={styles.results} role="listbox">
          {results.map((item) => (
            <li key={`${item.lat}-${item.lng}-${item.label}`}>
              <button
                type="button"
                className={styles.resultBtn}
                role="option"
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
              >
                <span className={styles.resultLabel}>{item.label}</span>
                <span className={styles.resultMeta}>{item.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export {
  AddressSearchField,
};
