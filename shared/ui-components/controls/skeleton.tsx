import React from "react";
import { cn } from "@/shared/libs/shadCnConfig";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-secondary/10 animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
