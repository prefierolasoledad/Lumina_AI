"use client";

import React from "react";
import DifficultyBadge from "./DifficultyBadge";

export default function QuestionPaper() {
  return (
    <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <span className="text-xs text-indigo-400 font-mono font-semibold tracking-wider uppercase">Sample Preview</span>
          <h2 className="text-2xl font-bold text-zinc-100 mt-1">Computer Science & AI Midterm</h2>
        </div>
        <div>
          <DifficultyBadge difficulty="medium" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex gap-4 items-start">
          <div className="text-xs font-mono bg-zinc-800 text-zinc-300 w-6 h-6 rounded-md flex items-center justify-center shrink-0">
            Q1
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex justify-between items-start gap-4">
              <p className="text-sm text-zinc-200 font-medium">Explain the concept of Overfitting in Deep Learning models. How can it be mitigated using regularization methods?</p>
              <span className="text-xs font-mono text-zinc-500 shrink-0 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-850">
                10 Marks
              </span>
            </div>
            <p className="text-xs text-zinc-500">Subjective / Essay Type</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex gap-4 items-start">
          <div className="text-xs font-mono bg-zinc-800 text-zinc-300 w-6 h-6 rounded-md flex items-center justify-center shrink-0">
            Q2
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex justify-between items-start gap-4">
              <p className="text-sm text-zinc-200 font-medium">Which optimization algorithm uses adaptive learning rates for each parameter individually?</p>
              <span className="text-xs font-mono text-zinc-500 shrink-0 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-850">
                5 Marks
              </span>
            </div>
            <p className="text-xs text-zinc-500">Multiple Choice Question</p>
          </div>
        </div>
      </div>
    </div>
  );
}
