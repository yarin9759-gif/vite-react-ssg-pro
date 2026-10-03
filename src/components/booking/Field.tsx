import type { ReactNode } from 'react';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}

// Label + input + accessible error/hint. The input must use the same `id` and
// aria-describedby={describedBy(id, error, hint)} from @/lib/form.
export default function Field({ id, label, error, hint, optional, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block font-medium text-stone-800 mb-1.5">
        {label}
        {optional && <span className="text-stone-500 font-normal"> (לא חובה)</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-sm text-stone-500">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1 text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}
