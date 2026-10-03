import type { DraftFormField, FormFieldType, GeometryType, ProjectFormField } from "../types";

/**
 * Client-side mirror of the Tileserver rules in
 * `app/domain/form_validation.py` and
 * `app/presentation/router/api/v1/endpoints/projects.py`.
 *
 * The point is to fail before the request, not to replace the server: a save that both
 * adds a `file` field and enables guest is rejected by `PATCH` only after `PUT /schema`
 * has already landed, so the pre-flight has to catch it first.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FIELD_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const FIELD_TYPES: readonly FormFieldType[] = [
  "text",
  "textarea",
  "number",
  "select",
  "multiselect",
  "date",
  "checkbox",
  "file",
];

const OPTION_TYPES: readonly FormFieldType[] = ["select", "multiselect"];

export type ProjectValidation = {
  /** Keyed by draft field index, so the editor can mark the offending row. */
  fieldErrors: Record<number, string>;
  /** Tab-level problems that are not attributable to one field. */
  formErrors: string[];
  valid: boolean;
};

function parseBound(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseOptions(value: string): string[] {
  return value
    .split("\n")
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
}

function parseExtensions(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((extension) => extension.trim().replace(/^\./, "").toLowerCase())
    .filter((extension) => extension.length > 0);
}

/** Drops keys the field type does not use so a stored schema stays as small as the server's own examples. */
function toStoredField(draft: DraftFormField): ProjectFormField {
  const field: ProjectFormField = {
    name: draft.name.trim(),
    label: draft.label.trim(),
    type: draft.type,
    required: draft.required,
  };

  if (draft.type === "number") {
    const min = parseBound(draft.min);
    const max = parseBound(draft.max);
    if (min !== null && !Number.isNaN(min)) field.min = min;
    if (max !== null && !Number.isNaN(max)) field.max = max;
  }
  if (OPTION_TYPES.includes(draft.type)) field.options = parseOptions(draft.options);
  if (draft.type === "file") field.extensions = parseExtensions(draft.extensions);

  return field;
}

export function draftFieldToStored(draft: DraftFormField): ProjectFormField {
  return toStoredField(draft);
}

export function draftFieldsToStored(drafts: DraftFormField[]): ProjectFormField[] {
  return drafts.map(toStoredField);
}

export function storedFieldToDraft(field: ProjectFormField): DraftFormField {
  return {
    name: field.name,
    label: field.label,
    type: field.type,
    required: field.required ?? false,
    min: field.min === undefined ? "" : String(field.min),
    max: field.max === undefined ? "" : String(field.max),
    options: field.options?.join("\n") ?? "",
    extensions: field.extensions?.join(", ") ?? "",
  };
}

export function emptyDraftField(index: number): DraftFormField {
  return {
    name: `field_${index + 1}`,
    label: "",
    type: "text",
    required: false,
    min: "",
    max: "",
    options: "",
    extensions: "",
  };
}

export function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

function validateFields(drafts: DraftFormField[]): Record<number, string> {
  const errors: Record<number, string> = {};
  const seen = new Map<string, number>();

  drafts.forEach((draft, index) => {
    const name = draft.name.trim();
    const label = draft.label.trim();

    if (!FIELD_NAME_PATTERN.test(name)) {
      errors[index] = "Nama kolom harus diawali huruf atau underscore, lalu huruf, angka, atau underscore.";
      return;
    }
    if (seen.has(name)) {
      errors[index] = `Nama kolom "${name}" sudah dipakai pada baris ${(seen.get(name) ?? 0) + 1}.`;
      return;
    }
    if (!label) {
      errors[index] = "Label tampil wajib diisi.";
      return;
    }
    if (!FIELD_TYPES.includes(draft.type)) {
      errors[index] = `Tipe kolom "${draft.type}" tidak dikenali.`;
      return;
    }
    if (OPTION_TYPES.includes(draft.type) && parseOptions(draft.options).length === 0) {
      errors[index] = `Kolom ${draft.type} minimal memerlukan satu opsi.`;
      return;
    }
    if (draft.type === "number") {
      const min = parseBound(draft.min);
      const max = parseBound(draft.max);
      if (Number.isNaN(min) || Number.isNaN(max)) {
        errors[index] = "Batas minimum dan maksimum harus berupa angka.";
        return;
      }
      if (min !== null && max !== null && min > max) {
        errors[index] = "Batas minimum tidak boleh lebih besar dari maksimum.";
        return;
      }
    }
    if (draft.type === "file" && parseExtensions(draft.extensions).length === 0) {
      errors[index] = "Kolom file minimal memerlukan satu ekstensi, misalnya jpg.";
      return;
    }

    seen.set(name, index);
  });

  return errors;
}

export type ProjectDraftForValidation = {
  name: string;
  slug: string;
  guestEnabled: boolean;
  fields: DraftFormField[];
};

export function validateProjectDraft(draft: ProjectDraftForValidation): ProjectValidation {
  const formErrors: string[] = [];
  const fieldErrors = validateFields(draft.fields);

  if (!draft.name.trim()) formErrors.push("Nama project wajib diisi.");
  if (draft.slug && !isValidSlug(normalizeSlug(draft.slug))) {
    formErrors.push("Slug hanya boleh huruf kecil, angka, dan satu tanda hubung.");
  }
  if (draft.guestEnabled) {
    if (!normalizeSlug(draft.slug)) formErrors.push("Slug publik wajib diisi sebelum guest diaktifkan.");
    if (draft.fields.some((field) => field.type === "file")) {
      formErrors.push("Guest submission tidak mendukung kolom file. Hapus kolom file atau nonaktifkan guest.");
    }
  }

  return { fieldErrors, formErrors, valid: formErrors.length === 0 && Object.keys(fieldErrors).length === 0 };
}

export function validateProjectIdentity(name: string, geometryType: GeometryType | ""): ProjectValidation {
  const formErrors: string[] = [];
  if (!name.trim()) formErrors.push("Nama project wajib diisi.");
  if (!geometryType) formErrors.push("Tipe geometry wajib dipilih.");
  return { fieldErrors: {}, formErrors, valid: formErrors.length === 0 };
}

/**
 * Mirrors `_project_is_open` in the Tileserver guest router, so the dashboard can say
 * whether `/guest/{slug}` resolves right now instead of leaving the operator to guess.
 */
export function guestAvailability(
  project: { guest_enabled: boolean; public_slug: string | null; guest_starts_at: string | null; guest_ends_at: string | null },
  now = new Date(),
): { state: "disabled" | "scheduled" | "open" | "ended"; message: string } {
  if (!project.guest_enabled || !project.public_slug) {
    return { state: "disabled", message: "Guest nonaktif. Formulir publik akan membalas 404." };
  }
  const startsAt = project.guest_starts_at ? new Date(project.guest_starts_at) : null;
  const endsAt = project.guest_ends_at ? new Date(project.guest_ends_at) : null;
  if (startsAt && startsAt > now) {
    return { state: "scheduled", message: `Terbuka mulai ${startsAt.toLocaleString("id-ID")}.` };
  }
  if (endsAt && endsAt < now) {
    return { state: "ended", message: `Sudah ditutup pada ${endsAt.toLocaleString("id-ID")}.` };
  }
  return { state: "open", message: "Tautan guest aktif dan bisa dibagikan." };
}

/** `datetime-local` value -> ISO instant, or `null` for blank input. */
export function toIsoDateTime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** ISO instant -> `datetime-local` value in the viewer's own timezone. */
export function toLocalDateTime(value: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

/**
 * Tileserver answers a rejected geofence with a `detail` object rather than a string:
 * `{"message": "geofence would exclude existing features", "feature_ids": [...]}`.
 */
export function geofenceExclusionCount(detail: unknown): number | null {
  if (typeof detail !== "object" || detail === null) return null;
  const ids = (detail as { feature_ids?: unknown }).feature_ids;
  return Array.isArray(ids) ? ids.length : null;
}

export function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
