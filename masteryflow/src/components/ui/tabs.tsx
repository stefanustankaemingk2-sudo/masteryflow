import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = ({ value, onValueChange, children, className }: { value?: string; onValueChange?: (value: string) => void; children: React.ReactNode; className?: string }) => (
  <div className={cn("", className)} data-value={value}>
    {React.Children.map(children, child => {
      if (React.isValidElement(child) && 'props' in child) {
        return React.cloneElement(child as any, { value, onValueChange });
      }
      return child;
    })}
  </div>
)

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className)} {...props} />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string }>(({ className, value, onClick, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    role="tab"
    onClick={(e) => {
      const parent = e.currentTarget.closest('[data-value]');
      const newValue = e.currentTarget.getAttribute('data-value') || value;
      const onValueChange = parent?.getAttribute('onvaluechange');
      if (onValueChange && newValue) {
        // Trigger custom event or callback
      }
      onClick?.(e);
    }}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value?: string }>(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    role="tabpanel"
    data-state={value ? "active" : "inactive"}
    className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
    {...props}
  />
))
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
