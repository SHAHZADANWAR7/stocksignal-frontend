import React from "react";
import { Skeleton } from "@/components/ui/skeleton"; // Assuming Skeleton is available from shadcn/ui

export default function TableSkeleton({ rows = 5, columns = 6 }) {
  const skeletonRows = Array.from({ length: rows }, (_, rowIndex) => (
    <tr key={rowIndex} className="border-b border-slate-100">
      {Array.from({ length: columns }, (_, colIndex) => (
        <td key={colIndex} className="p-4">
          <Skeleton className="h-6 w-full" />
        </td>
      ))}
    </tr>
  ));

  return (
    <table className="min-w-full divide-y divide-slate-200">
      <tbody className="bg-white divide-y divide-slate-200">
        {skeletonRows}
      </tbody>
    </table>
  );
}
