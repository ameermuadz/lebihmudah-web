"use client";

import { useState, KeyboardEvent, DragEvent } from "react";

interface ReorderableListInputProps {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  label?: string;
}

export default function ReorderableListInput({
  items,
  onChange,
  placeholder = "Add new...",
  label,
}: ReorderableListInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addItem = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onChange([...items, trimmed]);
      setInputValue("");
    }
  };

  const removeItem = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    onChange(next);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;

    const next = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  };

  const onDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const next = [...items];
    const item = next[draggedIndex];
    next.splice(draggedIndex, 1);
    next.splice(index, 0, item);
    
    onChange(next);
    setDraggedIndex(index);
  };

  const onDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {label && (
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </p>
      )}

      <div className="flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={addItem}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-500 shadow-md"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
            className={`group flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm transition-all cursor-move active:scale-[0.98] ${
              draggedIndex === index 
                ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg z-10 scale-[1.01]" 
                : "border-zinc-200 hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-900/60"
            }`}
          >
            <div className="flex flex-col gap-1 text-zinc-400 group-hover:text-emerald-500 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <circle cx="9" cy="5" r="1" />
                <circle cx="9" cy="12" r="1" />
                <circle cx="9" cy="19" r="1" />
                <circle cx="15" cy="5" r="1" />
                <circle cx="15" cy="12" r="1" />
                <circle cx="15" cy="19" r="1" />
              </svg>
            </div>
            
            <div className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 select-none">
              {item}
            </div>

            <div className="flex items-center gap-1">
              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveItem(index, "up"); }}
                  disabled={index === 0}
                  className="p-1 text-zinc-400 hover:text-emerald-600 disabled:opacity-0"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveItem(index, "down"); }}
                  disabled={index === items.length - 1}
                  className="p-1 text-zinc-400 hover:text-emerald-600 disabled:opacity-0"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeItem(index); }}
                className="ml-2 rounded-lg p-2 text-zinc-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/30"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-4 text-center text-xs text-zinc-500 italic">No rules added yet.</p>
        )}
      </div>
    </div>
  );
}
