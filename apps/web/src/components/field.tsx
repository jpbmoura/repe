import { cn } from '@repe/ui';
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <label className="block">
        <span className="text-text-secondary mb-1.5 block text-sm">{label}</span>
        <input
          ref={ref}
          {...props}
          className={cn(
            'bg-bg-subtle border-border focus:border-accent w-full rounded-chip border px-4 py-3 outline-none transition',
            className,
          )}
        />
        {error && <span className="text-danger mt-1 block text-xs">{error}</span>}
      </label>
    );
  },
);
Field.displayName = 'Field';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <label className="block">
        <span className="text-text-secondary mb-1.5 block text-sm">{label}</span>
        <textarea
          ref={ref}
          {...props}
          className={cn(
            'bg-bg-subtle border-border focus:border-accent w-full rounded-chip border px-4 py-3 outline-none transition',
            className,
          )}
        />
        {error && <span className="text-danger mt-1 block text-xs">{error}</span>}
      </label>
    );
  },
);
Textarea.displayName = 'Textarea';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => {
    return (
      <label className="block">
        <span className="text-text-secondary mb-1.5 block text-sm">{label}</span>
        <select
          ref={ref}
          {...props}
          className={cn(
            'bg-bg-subtle border-border focus:border-accent w-full rounded-chip border px-4 py-3 outline-none transition',
            className,
          )}
        >
          {children}
        </select>
        {error && <span className="text-danger mt-1 block text-xs">{error}</span>}
      </label>
    );
  },
);
Select.displayName = 'Select';
