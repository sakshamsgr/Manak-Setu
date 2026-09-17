import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, X, Loader2, Check } from 'lucide-react';

export interface StandardOption {
  id: string;
  code: string;
  title: string;
}

interface SearchableStandardSelectorProps {
  options: StandardOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const SearchableStandardSelector: React.FC<SearchableStandardSelectorProps> = ({
  options,
  selectedId,
  onSelect,
  isLoading = false,
  disabled = false,
  placeholder = 'Search BIS standard...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.id === selectedId) || null,
    [options, selectedId]
  );

  // Sync display text when selection changes from outside
  useEffect(() => {
    if (!isOpen) {
      if (selectedOption) {
        setSearchQuery(`${selectedOption.code} — ${selectedOption.title}`);
      } else {
        setSearchQuery('');
      }
    }
  }, [selectedOption, isOpen]);

  // Smart filter: partial, case-insensitive, normalized, multi-term
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    // If input exactly matches the selected display label, show all (user opened to browse)
    if (selectedOption && `${selectedOption.code} — ${selectedOption.title}`.toLowerCase() === q) {
      return options;
    }
    const cleanQ = q.replace(/[^a-z0-9]/g, '');
    const terms = q.split(/\s+/).filter(Boolean);

    return options.filter((opt) => {
      const code = opt.code.toLowerCase();
      const title = opt.title.toLowerCase();
      const id = opt.id.toLowerCase();
      const cleanCode = code.replace(/[^a-z0-9]/g, '');
      const cleanTitle = title.replace(/[^a-z0-9]/g, '');
      const cleanId = id.replace(/[^a-z0-9]/g, '');

      if (code.includes(q) || title.includes(q)) return true;
      if (cleanQ && (cleanCode.includes(cleanQ) || cleanTitle.includes(cleanQ) || cleanId.includes(cleanQ))) return true;
      const combined = `${code} ${title} ${id}`;
      if (terms.length > 1 && terms.every((term) => combined.includes(term))) return true;
      return false;
    });
  }, [options, searchQuery, selectedOption]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  // Close on outside click, restore display
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedOption) {
          setSearchQuery(`${selectedOption.code} — ${selectedOption.title}`);
        } else {
          setSearchQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  const handleSelectOption = (opt: StandardOption) => {
    onSelect(opt.id);
    setSearchQuery(`${opt.code} — ${opt.title}`);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (disabled || isLoading) return;
    setIsOpen(true);
    e.target.select();
  };

  const handleClick = () => {
    if (disabled || isLoading) return;
    if (!isOpen) {
      setIsOpen(true);
      inputRef.current?.select();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery('');
    setIsOpen(true);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || isLoading) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) { setIsOpen(true); setHighlightedIndex(0); }
      else if (filteredOptions.length > 0) setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) { setIsOpen(true); setHighlightedIndex(filteredOptions.length - 1); }
      else if (filteredOptions.length > 0) setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        e.preventDefault();
        handleSelectOption(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      if (selectedOption) setSearchQuery(`${selectedOption.code} — ${selectedOption.title}`);
      inputRef.current?.blur();
    } else if (e.key === 'Tab') {
      setIsOpen(false);
      if (selectedOption) setSearchQuery(`${selectedOption.code} — ${selectedOption.title}`);
    }
  };

  const isInputDisabled = disabled || isLoading;

  return (
    <div ref={containerRef} className="relative w-full min-w-0 max-w-full">
      {/* Input */}
      <div className="relative w-full min-w-0 max-w-full flex items-center">
        <div className="absolute left-3.5 pointer-events-none flex items-center z-10">
          {isLoading
            ? <Loader2 className="w-4 h-4 text-bis-600 animate-spin" />
            : <Search className="w-4 h-4 text-slate-400" />
          }
        </div>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="bis-standard-listbox"
          aria-autocomplete="list"
          aria-activedescendant={isOpen && highlightedIndex >= 0 ? `bis-std-opt-${highlightedIndex}` : undefined}
          disabled={isInputDisabled}
          value={isLoading ? 'Loading BIS standards...' : searchQuery}
          title={searchQuery || placeholder}
          placeholder={isLoading ? 'Loading BIS standards...' : placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={`w-full min-w-0 max-w-full h-11 box-border pl-10 pr-20 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs outline-none truncate ${
            isInputDisabled
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'cursor-text hover:border-slate-400'
          }`}
          style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
        />
        <div className="absolute right-2.5 flex items-center gap-1 z-10 bg-white pl-1 py-0.5 rounded-r-lg">
          {searchQuery && !isInputDisabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => { if (!isInputDisabled) { setIsOpen(!isOpen); inputRef.current?.focus(); } }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            aria-label="Toggle dropdown"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-bis-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !isInputDisabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 w-full min-w-0 max-w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50">
          <ul
            id="bis-standard-listbox"
            ref={listRef}
            role="listbox"
            aria-label="BIS Standards"
            className="max-h-72 sm:max-h-80 overflow-y-auto divide-y divide-slate-100 w-full min-w-0"
          >
            {filteredOptions.length === 0 ? (
              <li className="py-6 px-4 text-center text-xs sm:text-sm text-slate-500 font-medium">
                No BIS standards found.
              </li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.id === selectedId;
                const isHighlighted = index === highlightedIndex;
                return (
                  <li
                    key={opt.id}
                    id={`bis-std-opt-${index}`}
                    ref={(el) => (itemRefs.current[index] = el)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`p-3 cursor-pointer transition-colors flex items-start justify-between gap-3 group w-full min-w-0 box-border ${
                      isHighlighted ? 'bg-bis-50' : isSelected ? 'bg-bis-50/60' : 'hover:bg-slate-50'
                    } ${isSelected ? 'border-l-4 border-l-bis-700 pl-2.5' : 'pl-3'}`}
                  >
                    <div className="min-w-0 flex-1 break-words">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-snug break-words">
                        {opt.code}
                      </div>
                      <div className="text-xs text-slate-500 leading-snug mt-0.5 break-words">
                        {opt.title}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-bis-700 shrink-0 mt-0.5" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
