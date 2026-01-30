import * as React from "react";
import { Text as RNText } from "react-native";
import { cn } from "../../lib/utils";

interface TextProps extends React.ComponentPropsWithoutRef<typeof RNText> {
  className?: string;
  variant?: "default" | "h1" | "h2" | "h3" | "h4" | "p" | "lead" | "muted";
}

const Text = React.forwardRef<React.ElementRef<typeof RNText>, TextProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "text-foreground",
      h1: "text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground",
      h2: "text-3xl font-semibold tracking-tight text-foreground",
      h3: "text-2xl font-semibold tracking-tight text-foreground",
      h4: "text-xl font-semibold tracking-tight text-foreground",
      p: "text-base leading-7 text-foreground",
      lead: "text-xl text-muted-foreground",
      muted: "text-sm text-muted-foreground",
    };

    return (
      <RNText
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      />
    );
  },
);

Text.displayName = "Text";

export { Text };
