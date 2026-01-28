import React from "react";

export default function CardSkeleton() {
  return (
    <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 animate-pulse">
      <div className="h-6 bg-slate-300 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-300 rounded w-full"></div>
        <div className="h-4 bg-slate-300 rounded w-5/6"></div>
        <div className="h-8 bg-slate-300 rounded w-1/3 mt-4"></div>
      </div>
    </div>
  );
}
