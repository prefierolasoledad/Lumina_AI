"use client";

import React from "react";

export default function AssignmentForm() {
  return (
    <form className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-1">Create Assignment</h3>
        <p className="text-xs text-zinc-500">Configure parameters to generate your next assessment.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="assignment-title" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Assignment Title
          </label>
          <input
            id="assignment-title"
            type="text"
            placeholder="e.g. Midterm Physics Assessment"
            className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 transition-all duration-200 outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Assessment Details
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Total Marks"
              className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 transition-all duration-200 outline-hidden"
            />
            <input
              type="number"
              placeholder="Time Limit (mins)"
              className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 transition-all duration-200 outline-hidden"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        className="w-full py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/20 active:scale-98"
      >
        Generate Assessment
      </button>
    </form>
  );
}
