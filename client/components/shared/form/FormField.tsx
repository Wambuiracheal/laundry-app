import type { ReactNode } from "react";

export const formControlClass = "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm";
export const formSelectClass = formControlClass;
export const formTextareaClass = `${formControlClass} min-h-24`;
export const iconInputWrapperClass = "flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2";

type FormFieldProps = {
  htmlFor: string;
  label: string;
  info?: string;
  error?: string;
  children: ReactNode;
  placeholder?: string;
};

export function FormField({ htmlFor, label, info, error, children, placeholder }: Readonly<FormFieldProps>) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor={htmlFor}>
        {label}
      </label>
      {info ? <p className="mb-2 text-xs text-slate-500">{info}</p> : null}
      {children}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
      {placeholder ? <p className="mt-1 text-xs text-slate-400">{placeholder}</p> : null}
    </div>
  );
}
