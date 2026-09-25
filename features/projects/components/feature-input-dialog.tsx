"use client";

import { AlertCircle, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Project } from "../types";

type FeatureInputDialogProps = {
  project: Project;
  values: Record<string, string>;
  submitting: boolean;
  error: string | null;
  onChange: (name: string, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function FeatureInputDialog({
  project,
  values,
  submitting,
  error,
  onChange,
  onClose,
  onSubmit,
}: FeatureInputDialogProps) {
  const firstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
  const attachFirstField = (element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null) => {
    if (element) firstFieldRef.current = element;
  };

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, submitting]);

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-black/35 p-0 sm:place-items-center sm:p-6" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-form-title"
        className="max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl border border-black/10 bg-white shadow-[0_-12px_32px_rgba(28,27,25,0.18)] sm:max-w-lg sm:rounded-2xl sm:shadow-[0_18px_50px_rgba(28,27,25,0.24)]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-black/10 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#0f6b5f]">Feature baru · {project.geometry_type}</p>
            <h2 id="feature-form-title" className="mt-1 text-lg font-semibold text-[#1c1b19]">Input data {project.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Batalkan input Feature"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-[#6b6760] transition hover:bg-[#f2f1ee] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <form
          className="space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          {error ? (
            <p role="alert" className="flex gap-2 rounded-xl border border-[#c0392b]/25 bg-[#fff6f5] p-3 text-sm leading-5 text-[#8f2d23]">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {error}
            </p>
          ) : null}

          {project.form_schema.length === 0 ? (
            <p className="rounded-xl bg-[#f2f1ee] p-3 text-sm text-[#6b6760]">Project ini tidak memiliki kolom atribut. Simpan untuk membuat geometry saja.</p>
          ) : null}

          {project.form_schema.map((field, index) => {
            const inputId = `feature-field-${field.name}`;
            const common = {
              id: inputId,
              name: field.name,
              required: field.required,
              disabled: submitting,
              value: values[field.name] ?? "",
              onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(field.name, event.target.value),
              ref: index === 0 ? attachFirstField : undefined,
              className: "mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm text-[#1c1b19] shadow-sm outline-none transition placeholder:text-[#9c9890] focus:border-[#0f6b5f] focus:ring-2 focus:ring-[#0f6b5f]/20 disabled:cursor-not-allowed disabled:bg-[#f2f1ee]",
            };

            return (
              <div key={field.name}>
                <label htmlFor={inputId} className="text-sm font-semibold text-[#1c1b19]">
                  {field.label} {field.required ? <span className="text-[#c0392b]">*</span> : null}
                </label>
                {field.type === "textarea" ? <textarea rows={4} {...common} /> : null}
                {field.type === "select" ? (
                  <select {...common}>
                    <option value="">Pilih {field.label}</option>
                    {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : null}
                {field.type === "number" ? <input type="number" min={field.min} max={field.max} inputMode="decimal" {...common} /> : null}
                {field.type === "file" ? (
                  <div className="mt-1.5 rounded-xl border border-dashed border-black/15 bg-[#fbfbfa] p-3 text-sm text-[#6b6760]">
                    Lampiran untuk field ini dikelola melalui aplikasi lain dan tidak diunggah dari Map Editor.
                  </div>
                ) : null}
                {field.type === "text" ? <input type="text" {...common} /> : null}
                {field.type === "number" && (field.min !== undefined || field.max !== undefined) ? (
                  <p className="mt-1 text-xs text-[#6b6760]">Nilai: {field.min ?? "−∞"}–{field.max ?? "∞"}</p>
                ) : null}
              </div>
            );
          })}

          <div className="flex flex-col-reverse gap-2 border-t border-black/10 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={submitting} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-[#6b6760] transition hover:bg-[#f2f1ee] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">
              Batal
            </button>
            <button type="submit" disabled={submitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0f6b5f] px-4 text-sm font-semibold text-white transition hover:bg-[#0a5049] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">
              {submitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
              {submitting ? "Menyimpan…" : "Simpan Feature"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
