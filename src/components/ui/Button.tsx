import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  loading?: boolean;
  icon?: React.ReactNode;
}
export const Button: React.FC<ButtonProps> = ({ variant='primary', loading=false, icon, className, children, disabled, ...props }) => (
  <button {...props} disabled={disabled || loading}
    className={cn('inline-flex min-h-9 items-center justify-center gap-2 rounded-control px-3 text-xs font-medium transition-[background-color,border-color,color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50',
      variant==='primary' && 'bg-accent text-white hover:bg-accent-hover active:bg-accent-pressed',
      variant==='secondary' && 'border border-line bg-panel text-fg hover:border-muted hover:bg-bg',
      variant==='ghost' && 'bg-transparent text-muted hover:bg-bg hover:text-fg',
      variant==='destructive' && 'border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15',
      className)}>
    {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
    {children}
  </button>
);
export default Button;
