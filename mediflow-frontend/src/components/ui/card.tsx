import * as React from "react";
import { cn } from "./utils";

// --- Utility Prop Types ---
// Define the standard HTML element props for each component
type DivProps = React.HTMLAttributes<HTMLDivElement>;
type HeadingProps = React.HTMLAttributes<HTMLHeadingElement>;
type ParagraphProps = React.HTMLAttributes<HTMLParagraphElement>;

/* ----------------------------------------------------------------------------
 * 1. CARD ROOT
 * --------------------------------------------------------------------------*/

// Use React.forwardRef for all major components to allow external references (e.g., for animations or focus management)
const Card = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card"
      // Enhanced styles: Stronger shadow, subtle transition, and hover effect for engagement.
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-4 rounded-xl border border-gray-100 shadow-md transition-all duration-300 ease-in-out hover:shadow-xl",
        className,
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

/* ----------------------------------------------------------------------------
 * 2. CARD HEADER
 * --------------------------------------------------------------------------*/

const CardHeader = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-header"
      // Adjusted padding for a cleaner, modern look (pt-5, pb-5)
      className={cn(
        "grid items-start gap-1.5 px-6 pt-5 [.border-b]:pb-5 has-[[data-slot=card-action]]:grid-cols-[1fr_auto]",
        className,
      )}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

/* ----------------------------------------------------------------------------
 * 3. CARD TITLE
 * --------------------------------------------------------------------------*/

const CardTitle = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, ...props }, ref) => (
    <h3 // Use H3 for better semantic structure and accessibility
      ref={ref}
      data-slot="card-title"
      // Professional typography: Bold, tracking, and appropriate size.
      className={cn(
        "text-xl font-bold leading-snug tracking-tight text-gray-900",
        className,
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

/* ----------------------------------------------------------------------------
 * 4. CARD DESCRIPTION
 * --------------------------------------------------------------------------*/

const CardDescription = React.forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      data-slot="card-description"
      // Muted color for secondary information.
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

/* ----------------------------------------------------------------------------
 * 5. CARD ACTION
 * --------------------------------------------------------------------------*/

const CardAction = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-action"
      // Simplified layout class
      className={cn("justify-self-end", className)}
      {...props}
    />
  )
);
CardAction.displayName = "CardAction";

/* ----------------------------------------------------------------------------
 * 6. CARD CONTENT
 * --------------------------------------------------------------------------*/

const CardContent = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-content"
      // Adjusted bottom padding (pb-4) for vertical rhythm
      className={cn("px-6 pb-4", className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

/* ----------------------------------------------------------------------------
 * 7. CARD FOOTER
 * --------------------------------------------------------------------------*/

const CardFooter = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-footer"
      // Ensures content is spread out and maintains rhythm (pb-5)
      className={cn("flex items-center justify-between px-6 pb-5 [.border-t]:pt-5", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

/* ----------------------------------------------------------------------------
 * EXPORT
 * --------------------------------------------------------------------------*/

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};