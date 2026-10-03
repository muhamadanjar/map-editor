"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { DraftFormField, FormFieldType } from "../types";
import { emptyDraftField } from "../utils/project-validation";

type ProjectFormSchemaEditorProps = {
  fields: DraftFormField[];
  fieldErrors: Record<number, string>;
  guestEnabled: boolean;
  disabled: boolean;
  onChange: (fields: DraftFormField[]) => void;
};

const fieldTypeLabels: Record<FormFieldType, string> = {
  text: "Teks pendek",
  textarea: "Paragraf",
  number: "Angka",
  select: "Pilihan tunggal",
  multiselect: "Pilihan jamak",
  date: "Tanggal",
  checkbox: "Centang",
  file: "Lampiran",
};

const usesOptions: ReadonlySet<FormFieldType> = new Set<FormFieldType>(["select", "multiselect"]);

const inputClass =
  "mt-1 min-h-10 w-full rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-sm text-[#1c1b19] outline-none transition focus:border-[#0f6b5f] focus:ring-2 focus:ring-[#0f6b5f]/20 disabled:cursor-not-allowed disabled:bg-[#f2f1ee]";

function move(fields: DraftFormField[], index: number, offset: number): DraftFormField[] {
  const target = index + offset;
  if (target < 0 || target >= fields.length) return fields;
  const next = [...fields];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function ProjectFormSchemaEditor({
  fields,
  fieldErrors,
  guestEnabled,
  disabled,
  onChange,
}: ProjectFormSchemaEditorProps) {
  const update = (index: number, patch: Partial<DraftFormField>) => {
    onChange(fields.map((field, position) => (position === index ? { ...field, ...patch } : field)));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[#6b6760]">
          Kolom atribut yang muncul pada form input Feature dan pada formulir guest.
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...fields, emptyDraftField(fields.length)])}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 text-sm font-semibold text-[#0f6b5f] transition hover:bg-[#f2f7f6] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
        >
          <Plus className="size-4" aria-hidden="true" /> Tambah kolom
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 bg-[#fbfbfa] px-4 py-6 text-center text-sm text-[#6b6760]">
          Belum ada kolom atribut. Project bisa menyimpan geometry saja.
        </p>
      ) : null}

      {fields.some((field) => field.type === "file") && guestEnabled ? (
        <p className="rounded-xl border border-[#c0392b]/25 bg-[#fff6f5] p-3 text-sm leading-5 text-[#8f2d23]">
          Kolom file membuat formulir guest tidak dapat dipakai: Tileserver membalas 409 pada
          <span className="font-mono"> /guest/&#123;slug&#125;</span>. Simpan ini hanya bila guest memang dinonaktifkan.
        </p>
      ) : null}

      <ol className="space-y-2">
        {fields.map((field, index) => {
          const error = fieldErrors[index];
          return (
            <li
              key={`field-${index}`}
              className={`rounded-xl border bg-white p-3 ${error ? "border-[#c0392b]/45" : "border-black/10"}`}
            >
              <div className="flex items-start gap-2">
                <span className="mt-2 shrink-0 font-mono text-xs text-[#9c9890]" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`field-name-${index}`} className="text-xs font-semibold text-[#1c1b19]">
                      Nama kolom
                    </label>
                    <input
                      id={`field-name-${index}`}
                      value={field.name}
                      disabled={disabled}
                      spellCheck={false}
                      onChange={(event) => update(index, { name: event.target.value })}
                      placeholder="kondisi"
                      className={`${inputClass} font-mono`}
                    />
                  </div>

                  <div>
                    <label htmlFor={`field-label-${index}`} className="text-xs font-semibold text-[#1c1b19]">
                      Label tampil
                    </label>
                    <input
                      id={`field-label-${index}`}
                      value={field.label}
                      disabled={disabled}
                      onChange={(event) => update(index, { label: event.target.value })}
                      placeholder="Kondisi jalan"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor={`field-type-${index}`} className="text-xs font-semibold text-[#1c1b19]">
                      Tipe
                    </label>
                    <select
                      id={`field-type-${index}`}
                      value={field.type}
                      disabled={disabled}
                      onChange={(event) => update(index, { type: event.target.value as FormFieldType })}
                      className={inputClass}
                    >
                      {(Object.keys(fieldTypeLabels) as FormFieldType[]).map((type) => (
                        <option key={type} value={type}>
                          {fieldTypeLabels[type]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-end gap-2 pb-2 text-sm text-[#1c1b19]">
                    <input
                      type="checkbox"
                      checked={field.required}
                      disabled={disabled}
                      onChange={(event) => update(index, { required: event.target.checked })}
                      className="size-4 rounded border-black/25 accent-[#0f6b5f]"
                    />
                    Wajib diisi
                  </label>

                  {field.type === "number" ? (
                    <>
                      <div>
                        <label htmlFor={`field-min-${index}`} className="text-xs font-semibold text-[#1c1b19]">
                          Minimum
                        </label>
                        <input
                          id={`field-min-${index}`}
                          type="number"
                          inputMode="decimal"
                          value={field.min}
                          disabled={disabled}
                          onChange={(event) => update(index, { min: event.target.value })}
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                      <div>
                        <label htmlFor={`field-max-${index}`} className="text-xs font-semibold text-[#1c1b19]">
                          Maksimum
                        </label>
                        <input
                          id={`field-max-${index}`}
                          type="number"
                          inputMode="decimal"
                          value={field.max}
                          disabled={disabled}
                          onChange={(event) => update(index, { max: event.target.value })}
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                    </>
                  ) : null}

                  {usesOptions.has(field.type) ? (
                    <div className="sm:col-span-2">
                      <label htmlFor={`field-options-${index}`} className="text-xs font-semibold text-[#1c1b19]">
                        Opsi (satu per baris)
                      </label>
                      <textarea
                        id={`field-options-${index}`}
                        rows={3}
                        value={field.options}
                        disabled={disabled}
                        onChange={(event) => update(index, { options: event.target.value })}
                        placeholder={"baik\nrusak"}
                        className={`${inputClass} resize-y`}
                      />
                    </div>
                  ) : null}

                  {field.type === "file" ? (
                    <div className="sm:col-span-2">
                      <label htmlFor={`field-extensions-${index}`} className="text-xs font-semibold text-[#1c1b19]">
                        Ekstensi yang diizinkan
                      </label>
                      <input
                        id={`field-extensions-${index}`}
                        value={field.extensions}
                        disabled={disabled}
                        onChange={(event) => update(index, { extensions: event.target.value })}
                        placeholder="jpg, png, pdf"
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    disabled={disabled || index === 0}
                    onClick={() => onChange(move(fields, index, -1))}
                    aria-label={`Naikkan kolom ${field.label || field.name}`}
                    className="grid size-8 place-items-center rounded-lg text-[#6b6760] transition hover:bg-[#f2f1ee] disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={disabled || index === fields.length - 1}
                    onClick={() => onChange(move(fields, index, 1))}
                    aria-label={`Turunkan kolom ${field.label || field.name}`}
                    className="grid size-8 place-items-center rounded-lg text-[#6b6760] transition hover:bg-[#f2f1ee] disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(fields.filter((_, position) => position !== index))}
                    aria-label={`Hapus kolom ${field.label || field.name}`}
                    className="grid size-8 place-items-center rounded-lg text-[#c0392b] transition hover:bg-[#fff6f5] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c0392b]"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {error ? (
                <p role="alert" className="mt-2 text-xs leading-5 text-[#8f2d23]">
                  {error}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
