import * as React from "react";

const TabsContext = React.createContext();

const Tabs = ({ defaultValue, value, onValueChange, children, className = "" }) => {
  const [selectedTab, setSelectedTab] = React.useState(value || defaultValue);

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedTab(value);
    }
  }, [value]);

  const handleTabChange = (newValue) => {
    setSelectedTab(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ selectedTab, setSelectedTab: handleTabChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsList = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref__={ref}
    className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 ${className}`}
    {...props}
  />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef(({ className = "", value, ...props }, ref) => {
  const { selectedTab, setSelectedTab } = React.useContext(TabsContext);
  const isSelected = selectedTab === value;

  return (
    <button
      ref__={ref}
      type="button"
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isSelected ? "bg-white text-slate-900 shadow-sm" : "hover:bg-slate-200"
      } ${className}`}
      onClick={() => setSelectedTab(value)}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef(({ className = "", value, ...props }, ref) => {
  const { selectedTab } = React.useContext(TabsContext);
  if (selectedTab !== value) return null;

  return (
    <div
      ref__={ref}
      className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${className}`}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
