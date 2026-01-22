import * as React from "react";

const TooltipProvider = ({ children }) => {
  return <>{children}</>;
};

const Tooltip = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <div className="relative inline-block">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { isOpen, setIsOpen })
      )}
    </div>
  );
};

const TooltipTrigger = React.forwardRef(({ asChild, children, isOpen, setIsOpen, ...props }, ref) => {
  const childProps = {
    onMouseEnter: () => setIsOpen(true),
    onMouseLeave: () => setIsOpen(false),
    onFocus: () => setIsOpen(true),
    onBlur: () => setIsOpen(false)
  };

  return asChild ? React.cloneElement(children, childProps) : <div {...childProps} {...props}>{children}</div>;
});
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef(({ className = "", children, isOpen, sideOffset = 4, ...props }, ref) => {
  if (!isOpen) return null;

  return (
    <div
      ref__={ref}
      className={`absolute z-50 overflow-hidden rounded-md border border-slate-200 bg-slate-900 px-3 py-1.5 text-sm text-white shadow-md animate-in fade-in-0 zoom-in-95 ${className}`}
      style={{ top: `calc(100% + ${sideOffset}px)`, left: '50%', transform: 'translateX(-50%)' }}
      {...props}
    >
      {children}
    </div>
  );
});
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
