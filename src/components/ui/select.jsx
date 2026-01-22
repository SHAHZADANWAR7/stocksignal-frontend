import * as React from "react";
import { ChevronDown } from "lucide-react";

const Select = ({ children, value, onValueChange, ...props }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref__={selectRef} className="relative" {...props}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { isOpen, setIsOpen, value, onValueChange })
      )}
    </div>
  );
};

const SelectTrigger = React.forwardRef(({ className = "", children, isOpen, setIsOpen, ...props }, ref) => (
  <button
    ref__={ref}
    type="button"
    onClick={() => setIsOpen(!isOpen)}
    className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder, value, children }) => {
  return <span>{value || placeholder}</span>;
};

const SelectContent = ({ className = "", children, isOpen, onValueChange, setIsOpen, value }) => {
  if (!isOpen) return null;

  return (
    <div
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 text-base shadow-lg focus:outline-none sm:text-sm ${className}`}
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { onValueChange, setIsOpen, currentValue: value })
      )}
    </div>
  );
};

const SelectItem = ({ className = "", children, value, onValueChange, setIsOpen, currentValue, ...props }) => {
  const isSelected = value === currentValue;

  return (
    <div
      className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-slate-100 ${
        isSelected ? "bg-slate-100 font-semibold" : ""
      } ${className}`}
      onClick={() => {
        onValueChange?.(value);
        setIsOpen(false);
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
