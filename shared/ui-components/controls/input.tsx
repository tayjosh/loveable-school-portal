import * as React from "react";

import { cn } from "@/shared/libs/shadCnConfig";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  // If a `value` prop is provided but undefined, coerce it to an empty
  // string to avoid React uncontrolled -> controlled warnings. We only
  // override when the caller provided a `value` prop (controlled use).
  const hasValueProp = Object.prototype.hasOwnProperty.call(props, "value");
  const valueProp = hasValueProp ? (props.value ?? "") : undefined;

  // Remove `value` from rest to avoid spreading it twice
  const { value, ...rest } = props as any;

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input file:text-foreground placeholder:text-sm  placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm whitespace-nowrap",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] ",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...rest}
      {...(hasValueProp ? { value: valueProp } : {})}
    />
  );
}

export { Input };
