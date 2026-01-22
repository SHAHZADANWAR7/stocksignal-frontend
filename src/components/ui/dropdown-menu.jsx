import * as React from "react";

const DropdownMenu = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref__={menuRef} className="relative inline-block text-left">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { isOpen, setIsOpen })
      )}
    </div>
  );
};

const DropdownMenuTrigger = React.forwardRef(({ asChild, children, isOpen, setIsOpen, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "button";
  const childProps = asChild
    ? { onClick: () => setIsOpen(!isOpen) }
    : { ref, onClick: () => setIsOpen(!isOpen), type: "button", ...props };

  return asChild ? React.cloneElement(children, childProps) : <Comp {...childProps}>{children}</Comp>;
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef(({ className = "", align = "center", children, isOpen, setIsOpen, ...props }, ref) => {
  if (!isOpen) return null;

  const alignmentClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0"
  };

  return (
    <div
      ref__={ref}
      className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md mt-1 ${alignmentClasses[align]} ${className}`}
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { setIsOpen })
      )}
    </div>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef(({ className = "", setIsOpen, onClick, ...props }, ref) => (
  <div
    ref__={ref}
    className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 ${className}`}
    onClick={(e) => {
      onClick?.(e);
      setIsOpen(false);
    }}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuLabel = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref__={ref}
    className={`px-2 py-1.5 text-sm font-semibold ${className}`}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref__={ref}
    className={`-mx-1 my-1 h-px bg-slate-200 ${className}`}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator };
