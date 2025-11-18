'use client';

import { useState, useRef, useEffect } from 'react';

interface PillRankingQuestionProps {
  question: string;
  items: string[];
  value: string[];
  onChange: (newOrder: string[]) => void;
  helpText?: string;
}

export default function PillRankingQuestion({
  question,
  items,
  value,
  onChange,
  helpText,
}: PillRankingQuestionProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isProcessingCustom, setIsProcessingCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset highlighted index when search text changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchText]);

  // Find matching items based on search text
  const getMatchingItems = () => {
    if (!searchText.trim()) return [];
    
    const searchLower = searchText.toLowerCase();
    return items
      .map((item, index) => ({ item, index, originalIndex: index }))
      .filter(({ item }) => !value.includes(item)) // Exclude already selected
      .filter(({ item }) => item.toLowerCase().includes(searchLower))
      .sort((a, b) => {
        const aStartsWith = a.item.toLowerCase().startsWith(searchLower);
        const bStartsWith = b.item.toLowerCase().startsWith(searchLower);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return 0;
      });
  };

  // Highlight matching text within item
  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text;
    
    const regex = new RegExp(`(${search})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      if (regex.test(part)) {
        return <mark key={i} className="bg-yellow-400 dark:bg-yellow-500 text-gray-900 dark:text-gray-900 font-semibold rounded px-0.5">{part}</mark>;
      }
      return part;
    });
  };

  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const matchingItems = getMatchingItems();

    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (!searchText.trim()) return;

      // If there's an exact match or a highlighted item, select it
      if (matchingItems.length > 0) {
        const selectedItem = highlightedIndex >= 0 && highlightedIndex < matchingItems.length
          ? matchingItems[highlightedIndex].item
          : matchingItems[0].item;
        
        onChange([...value, selectedItem]);
        setSearchText('');
        setHighlightedIndex(-1);
        return;
      }

      // No match found - create custom pill (skip AI correction for speed)
      // Simply add the text as entered
      onChange([...value, searchText.trim()]);
      setSearchText('');
      setHighlightedIndex(-1);
      return;
      
      /* AI correction disabled for performance - was causing 3+ second delays
      setIsProcessingCustom(true);
      try {
        const corrected = await correctSpelling(searchText.trim());
        onChange([...value, corrected]);
        setSearchText('');
        setHighlightedIndex(-1);
      } catch (error) {
        console.error('Error correcting spelling:', error);
        // Fallback: add as-is if AI fails
        onChange([...value, searchText.trim()]);
        setSearchText('');
        setHighlightedIndex(-1);
      } finally {
        setIsProcessingCustom(false);
      }
      */
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < matchingItems.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Escape') {
      setSearchText('');
      setHighlightedIndex(-1);
    }
  };

  const correctSpelling = async (text: string): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    try {
      const response = await fetch('/api/correct-spelling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Spelling correction failed');

      const data = await response.json();
      return data.corrected || text;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Spelling correction timeout - using original text');
      } else {
        console.error('Spelling correction error:', error);
      }
      return text; // Return original if correction fails or times out
    }
  };

  const handleClick = (item: string) => {
    const currentIndex = value.indexOf(item);
    
    if (currentIndex === -1) {
      // Item não está na lista selecionada, adiciona no final
      onChange([...value, item]);
    } else {
      // Item já está selecionado, remove
      const newValue = value.filter((v) => v !== item);
      onChange(newValue);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: string) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverIndex(index);
  };

  const handleDragLeave = () => {
    setDraggedOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    const draggedIndex = value.indexOf(draggedItem);
    if (draggedIndex === -1) return;
    
    const newValue = [...value];
    newValue.splice(draggedIndex, 1);
    newValue.splice(targetIndex, 0, draggedItem);
    
    onChange(newValue);
    setDraggedItem(null);
    setDraggedOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverIndex(null);
  };

  const getPosition = (item: string) => {
    const index = value.indexOf(item);
    return index === -1 ? null : index + 1;
  };

  const isSelected = (item: string) => value.includes(item);

  const matchingItems = getMatchingItems();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{question}</p>
        {helpText && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{helpText}</p>
        )}
      </div>

      {/* Search/Find Input Box */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="🔍 Escreve para procurar ou adicionar..."
            className="w-full px-4 py-3 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            disabled={isProcessingCustom}
          />
          {isProcessingCustom && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Dropdown with matching suggestions */}
        {searchText.trim() && matchingItems.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {matchingItems.map(({ item, originalIndex }, idx) => (
              <button
                key={originalIndex}
                type="button"
                onClick={() => {
                  onChange([...value, item]);
                  setSearchText('');
                  setHighlightedIndex(-1);
                }}
                className={`w-full text-left px-4 py-2.5 transition-colors ${
                  idx === highlightedIndex
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                {highlightMatch(item, searchText)}
              </button>
            ))}
          </div>
        )}

        {/* No matches - will create custom */}
        {searchText.trim() && matchingItems.length === 0 && (
          <div className="mt-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
            Pressiona <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">Enter</kbd> para adicionar <strong className="text-gray-900 dark:text-gray-100">{searchText}</strong>
          </div>
        )}
      </div>

      {/* Pills não selecionadas */}
      <div className="flex flex-wrap gap-3">
        {items.map((item) => {
          const selected = isSelected(item);
          const isHighlighted = searchText.trim() && item.toLowerCase().includes(searchText.toLowerCase());
          
          if (selected) return null; // Não mostra aqui se já está selecionado
          
          return (
            <button
              key={item}
              type="button"
              onClick={() => handleClick(item)}
              className={`px-4 py-2.5 rounded-full font-medium transition-all ${
                isHighlighted
                  ? 'bg-blue-500 dark:bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-400 shadow-md scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-sm'
              }`}
            >
              {isHighlighted ? highlightMatch(item, searchText) : item}
            </button>
          );
        })}
      </div>

      {/* Pills selecionadas (draggable) */}
      {value.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/40 rounded-lg border-2 border-blue-200 dark:border-blue-700">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📌 Selecionados ({value.length}) — arrasta para reordenar:
          </p>
          <div className="flex flex-wrap gap-3">
            {value.map((item, index) => {
              const isDragging = draggedItem === item;
              const isDraggedOver = draggedOverIndex === index;

              return (
                <div
                  key={item}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    relative px-5 py-3 rounded-full font-medium transition-all cursor-grab active:cursor-grabbing
                    ${isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}
                    ${isDraggedOver ? 'ring-4 ring-blue-400 scale-105 translate-y-0.5' : ''}
                    bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl
                  `}
                >
                  {/* Conteúdo principal com bolinha do número antes da mão */}
                  <span className="inline-flex items-center gap-2 select-none">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-800 text-xs font-bold shadow-sm">
                      {index + 1}
                    </span>
                    <span>✋</span>
                    <span>{item}</span>
                  </span>

                  {/* Cruz discreta no canto superior direito */}
                  <button
                    type="button"
                    onClick={() => handleClick(item)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-500/80 text-white flex items-center justify-center text-xs font-bold shadow-sm hover:bg-blue-400 hover:scale-110 transition-transform"
                    title="Remover"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
