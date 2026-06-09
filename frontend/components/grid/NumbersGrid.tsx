"use client";

import { useMemo } from "react";

interface NumbersGridProps {
  total: number;
  taken: Set<number>;
  mine: Set<number>;
  selected: Set<number>;
  maxSelectable: number;
  onToggle: (numero: number) => void;
  filter?: string;
}

export function NumbersGrid({ total, taken, mine, selected, maxSelectable, onToggle, filter }: NumbersGridProps) {
  const filtered = useMemo(() => {
    if (!filter) return null;
    const n = Number(filter.replace(/\D/g, ""));
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [filter]);

  const numbers = useMemo(() => Array.from({ length: total }, (_, i) => i + 1), [total]);

  return (
    <div className="numbers-grid" role="grid" aria-label={`Grade de ${total} números`}>
      {numbers.map((n) => {
        const isMine = mine.has(n);
        const isTaken = taken.has(n) && !isMine;
        const isSelected = selected.has(n);
        const isHighlight = filtered === n;

        let cls = "num-cell ";
        if (isMine) cls += "num-mine";
        else if (isSelected) cls += "num-selected";
        else if (isTaken) cls += "num-taken";
        else cls += "num-free";

        const reachedLimit = !isSelected && selected.size >= maxSelectable;

        return (
          <button
            key={n}
            type="button"
            className={`${cls} ${isHighlight ? "pulse-yellow" : ""}`}
            onClick={() => {
              if (isTaken || isMine) return;
              if (reachedLimit) return;
              onToggle(n);
            }}
            disabled={isTaken || (reachedLimit && !isSelected)}
            aria-pressed={isSelected}
            aria-label={`Número ${n}${isTaken ? " ocupado" : isMine ? " seu" : isSelected ? " selecionado" : " disponível"}`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
