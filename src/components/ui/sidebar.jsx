import * as React from "react";

const SidebarContext = React.createContext();

const SidebarProvider = ({ defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

const Sidebar = ({ className = "", children, ...props }) => {
  const { isOpen } = React.useContext(SidebarContext);

  return (
    <aside
      className={`${isOpen ? "w-64" : "w-0"} transition-all duration-300 overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </aside>
  );
};

const SidebarHeader = ({ className = "", ...props }) => (
  <div className={`px-3 py-2 ${className}`} {...props} />
);

const SidebarContent = ({ className = "", ...props }) => (
  <div className={`flex-1 overflow-auto ${className}`} {...props} />
);

const SidebarGroup = ({ className = "", ...props }) => (
  <div className={`px-3 py-2 ${className}`} {...props} />
);

const SidebarGroupContent = ({ className = "", ...props }) => (
  <div className={className} {...props} />
);

const SidebarMenu = ({ className = "", ...props }) => (
  <ul className={`space-y-1 ${className}`} {...props} />
);

const SidebarMenuItem = ({ className = "", ...props }) => (
  <li className={className} {...props} />
);

const SidebarMenuButton = React.forwardRef(({ asChild, className = "", ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "button";
  const buttonClass = asChild ? "" : `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-100 ${className}`;

  return asChild ? (
    React.cloneElement(props.children, { className: `${buttonClass} ${props.children.props.className || ""}` })
  ) : (
    <Comp ref__={ref} className={buttonClass} {...props} />
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarTrigger = ({ className = "", ...props }) => {
  const { isOpen, setIsOpen } = React.useContext(SidebarContext);

  return (
    <button
      className={`p-2 ${className}`}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
};

export {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
};
