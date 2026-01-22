import * as React from "react";

const Collapsible = ({ open, onOpenChange, children, ...props }) => {
  return (
    <div {...props}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { open, onOpenChange })
      )}
    </div>
  );
};

const CollapsibleTrigger = React.forwardRef(({ asChild, children, onOpenChange, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "button";
  const childProps = asChild
    ? { onClick: () => onOpenChange?.(!props.open) }
    : { ref, onClick: () => onOpenChange?.(!props.open), type: "button", ...props };

  return asChild ? React.cloneElement(children, childProps) : <Comp {...childProps}>{children}</Comp>;
});
CollapsibleTrigger.displayName = "CollapsibleTrigger";

const CollapsibleContent = ({ open, className = "", ...props }) => {
  if (!open) return null;

  return (
    <div className={`overflow-hidden transition-all ${className}`} {...props} />
  );
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
