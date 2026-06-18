import React from "react";

export type Difficulty = "easy" | "medium" | "hard";

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const configs = {
    easy: {
      text: "Easy",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      color: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    medium: {
      text: "Medium",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      color: "text-amber-400",
      dot: "bg-amber-400",
    },
    hard: {
      text: "Hard",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      color: "text-rose-400",
      dot: "bg-rose-400",
    },
  };

  const current = configs[difficulty] || configs.medium;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg} ${current.border} ${current.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.text}
    </span>
  );
}
