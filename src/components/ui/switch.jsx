import React from "react";

export function Switch({ checked, onCheckedChange, className = "" }) {
  return (
    <button
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 transition-colors ${
        checked ? "bg-blue-600" : "bg-gray-300"
      } ${className}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
