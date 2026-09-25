import type { ReactNode } from "react";

const focusRing = "outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export const formControlClass = `w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 ${focusRing}`;
export const formSelectClass = formControlClass;
export const formTextareaClass = `${formControlClass} min-h-24 resize-y`;
export const iconInputWrapperClass =
  "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-400 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 [&_input]:text-slate-900 [&_input]:placeholder:text-slate-400 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0";
export const submitButtonClass =
  "w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60";

type FormFieldProps = {
  htmlFor: string;
  label: string;
  info?: string;
  error?: string;
  children: ReactNode;
  placeholder?: string;
};

export function FormField({ htmlFor, label, info, error, children, placeholder }: FormFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600">{error}</p>
      ) : info ? (
        <p className="mt-1.5 text-xs text-slate-400">{info}</p>
      ) : null}
      {placeholder ? <p className="mt-1 text-xs text-slate-400">{placeholder}</p> : null}
    </div>
  );
}

export function FormStatusMessage({ message }: { message: string }) {
  const isError = /(failed|required|invalid|error)/i.test(message);
  return (
    <p
      className={`rounded-xl border px-3 py-2 text-sm font-medium ${
        isError ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {message}
    </p>
  );
}
