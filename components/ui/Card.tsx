import { HTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "outline";
  padding?: "sm" | "md" | "lg";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { children, variant = "default", padding = "md", className, ...props },
    ref
  ) => {
    const variants = {
      default: "bg-dark-lighter border border-dark-gray",
      glass: "glass-effect border border-dark-gray",
      outline: "border-2 border-dark-gray bg-transparent",
    };

    const paddings = {
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-2xl transition-all duration-200",
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
