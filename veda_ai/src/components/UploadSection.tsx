"use client";

import React, { useState } from "react";

export default function UploadSection() {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      className={`p-8 rounded-2xl border border-dashed transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[220px] ${
        dragActive
          ? "border-indigo-500 bg-indigo-500/5"
          : "border-zinc-800 bg-zinc-905/30 hover:border-zinc-700"
      }`}
    >
      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center mb-4 text-zinc-400">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      <p className="text-sm text-zinc-300 font-semibold mb-1">Upload syllabus material or documents</p>
      <p className="text-xs text-zinc-500 mb-4">Support for PDF, DOCX, TXT up to 10MB</p>

      <label className="cursor-pointer px-4 py-2 text-xs font-semibold bg-zinc-850 hover:bg-zinc-800 border border-zinc-850 rounded-lg text-zinc-200 hover:text-white transition-all duration-200">
        Select Files
        <input type="file" className="hidden" multiple />
      </label>
    </div>
  );
}
