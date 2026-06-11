"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  leftIcon?: React.ReactNode;
};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, leftIcon, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative w-full">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </span>
        )}
        <Input
          ref={ref}
          type={showPassword ? "text" : "password"}
          className={cn(leftIcon && "pl-9", "pr-10", className)}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setShowPassword((prev) => !prev);
          }}
          disabled={disabled}
          className="absolute right-3 top-1/2 z-20 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-50"
          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
