"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formControlClass } from "@/components/shared/form/FormField";
import { searchAddresses, type AddressSuggestion } from "@/utils/addressSearch";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 350;

type AddressAutocompleteProps = {
  id: string;
  value: string;
  placeholder?: string;
  /** Free typing. Any previously picked suggestion no longer applies. */
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
};

export function AddressAutocomplete({ id, value, placeholder, onChange, onSelect }: AddressAutocompleteProps) {
  const listboxId = useId();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      abortRef.current?.abort();
    },
    [],
  );

  function scheduleSearch(query: string) {
    window.clearTimeout(timerRef.current);
    abortRef.current?.abort();

    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = window.setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const results = await searchAddresses(query.trim(), controller.signal);
        setSuggestions(results);
        setActiveIndex(-1);
        setSearchError(null);
        setOpen(true);
      } catch (error) {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setSearchError(error instanceof Error ? error.message : "Address search failed.");
        setOpen(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  function choose(suggestion: AddressSuggestion) {
    window.clearTimeout(timerRef.current);
    abortRef.current?.abort();
    setLoading(false);
    setOpen(false);
    onSelect(suggestion);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      // Pick the highlighted address instead of submitting the form.
      event.preventDefault();
      choose(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && (suggestions.length > 0 || searchError !== null || !loading);

  return (
    <div className="relative">
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        className={`${formControlClass} pr-9`}
        placeholder={placeholder}
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          scheduleSearch(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
      />
      {loading ? (
        <span
          aria-hidden
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"
        />
      ) : null}

      {showList ? (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10">
          <ul id={listboxId} role="listbox" aria-label="Address suggestions">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                // mousedown (not click) so the input's blur doesn't close the list first.
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(suggestion);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`cursor-pointer px-3 py-2 ${index === activeIndex ? "bg-blue-50" : ""}`}
              >
                <p className="text-sm font-medium text-slate-900">{suggestion.title}</p>
                {suggestion.subtitle ? <p className="text-xs text-slate-500">{suggestion.subtitle}</p> : null}
              </li>
            ))}
          </ul>
          {suggestions.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">
              {searchError ? "Address suggestions are unavailable right now. Type your address in full." : "No matches. You can still type the address in full."}
            </p>
          ) : null}
          <p className="border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-400">
            Search by Photon · ©{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline" onMouseDown={(event) => event.preventDefault()}>
              OpenStreetMap
            </a>{" "}
            contributors
          </p>
        </div>
      ) : null}
    </div>
  );
}
