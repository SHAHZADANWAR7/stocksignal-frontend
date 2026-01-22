import * as React from "react";
import { X } from "lucide-react";

const Dialog = ({ children, open, onOpenChange }) => {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {React.Children.map(children, (child) =>
          React.cloneElement(child, { onOpenChange })
        )}
      </div>
    </>
  );
};

const DialogContent = React.forwardRef(({ className = "", children, onOpenChange, ...props }, ref) => (
  <div
    ref__={ref}
    className={`relative z-50 w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-lg ${className}`}
    onClick={(e) => e.stopPropagation()}
    {...props}
  >
    {children}
    <button
      onClick={() => onOpenChange(false)}
      className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className = "", ...props }) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  />
);

const DialogTitle = React.forwardRef(({ className = "", ...props }, ref) => (
  <h2
    ref__={ref}
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef(({ className = "", ...props }, ref) => (
  <p
    ref__={ref}
    className={`text-sm text-slate-500 ${className}`}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription };
