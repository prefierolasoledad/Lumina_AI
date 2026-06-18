"use client";

import React from "react";

export default function StudentInfo() {
  return (
    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center font-bold text-sm text-zinc-350">
          JD
        </div>
        <div>
          <h4 className="font-semibold text-sm text-zinc-150">John Doe</h4>
          <p className="text-xs text-zinc-500">Student ID: STU-2026-9042</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs font-mono text-zinc-400 border-t border-zinc-850 pt-4">
        <div>
          <div className="text-zinc-600 uppercase tracking-wider text-[10px] mb-1">Class / Grade</div>
          <div className="text-zinc-300 font-medium">B.Tech CSE - Sec A</div>
        </div>
        <div>
          <div className="text-zinc-600 uppercase tracking-wider text-[10px] mb-1">Email Address</div>
          <div className="text-zinc-300 font-medium">john.doe@university.edu</div>
        </div>
      </div>
    </div>
  );
}
