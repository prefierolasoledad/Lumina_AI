"use client";

import React, { useState } from "react";

export type QuestionType = "mcq" | "short" | "long" | "boolean";

export default function QuestionTypeSelector() {
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(["mcq"]);

  const toggleType = (type: QuestionType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const typesList: { id: QuestionType; label: string; desc: string }[] = [
    { id: "mcq", label: "Multiple Choice", desc: "Single/multi-correct choices" },
    { id: "short", label: "Short Answer", desc: "1-2 sentences responses" },
    { id: "long", label: "Subjective / Essay", desc: "Detailed analytical answers" },
    { id: "boolean", label: "True / False", desc: "Binary choice evaluation" },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        Question Types
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {typesList.map((type) => {
          const isSelected = selectedTypes.includes(type.id);
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => toggleType(type.id)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? "border-indigo-500 bg-indigo-500/10 text-white"
                  : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${isSelected ? "text-indigo-400" : "text-zinc-300"}`}>
                  {type.label}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                )}
              </div>
              <p className="text-xs text-zinc-550 line-clamp-1">{type.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
