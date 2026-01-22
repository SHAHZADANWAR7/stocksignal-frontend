import * as React from "react";

const Progress = React.forwardRef(({ className = "", value = 0, ...props }, ref) => (
  <div
    ref__={ref}
    className={`relative h-4 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
    {...props}
  >
    <div
      className="h-full w-full flex-1 bg-blue-600 transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
));
Progress.displayName = "Progress";

export { Progress };
