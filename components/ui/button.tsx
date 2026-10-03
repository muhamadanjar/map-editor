import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Slot } from 'radix-ui';

type ButtonVariant = 'default' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'destructive' | 'link';
type ButtonSize = 'default' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';

type ButtonVariantOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantOptions {
  asChild?: boolean;
}

const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/35 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variantClasses: Record<ButtonVariant, string> = {
  default: 'border border-border bg-background text-foreground hover:bg-accent',
  primary: 'bg-primary text-primary-foreground hover:bg-[var(--action-hover)]',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'bg-transparent text-foreground hover:bg-accent',
  danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive/30',
  outline: 'border border-border bg-background text-foreground hover:bg-accent',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive/30',
  link: 'text-primary underline-offset-4 hover:underline',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 py-2 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'size-8 p-0',
  'icon-xs': 'size-8 p-0',
  'icon-sm': 'size-8 p-0',
  'icon-lg': 'size-10 p-0',
};

export function buttonVariants({
  variant = 'default',
  size = 'md',
  className = '',
}: ButtonVariantOptions = {}) {
  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className = '', variant = 'default', size = 'md', ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'button';

    return (
      <Comp
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
