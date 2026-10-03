// Helpers for form inputs rendered with <Field> (src/components/booking/Field.tsx).
export function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  return hint ? `${id}-hint` : undefined;
}

export const inputClass = (error?: string) =>
  `w-full rounded-lg border bg-white px-4 py-3 text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
    error ? 'border-red-500' : 'border-stone-300'
  }`;
