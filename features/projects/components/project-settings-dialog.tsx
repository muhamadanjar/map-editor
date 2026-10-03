"use client";

import { AlertCircle, LoaderCircle, Settings2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createProject, replaceProjectSchema, updateProject } from "../api/projects-api";
import type { DraftFormField, GeometryType, Position, Project, ProjectFormField, ProjectGeofence } from "../types";
import {
  draftFieldsToStored,
  normalizeSlug,
  storedFieldToDraft,
  suggestSlug,
  toIsoDateTime,
  toLocalDateTime,
  validateProjectDraft,
} from "../utils/project-validation";
import { ProjectFormSchemaEditor } from "./project-form-schema-editor";
import { ProjectGeofenceSettings } from "./project-geofence-settings";
import { ProjectGuestSettings } from "./project-guest-settings";

type SettingsTab = "identity" | "schema" | "guest" | "geofence";

type ProjectSettingsDialogProps = {
  /** `null` puts the dialog in create mode. */
  project: Project | null;
  featureCount: number;
  /** Geofence state is owned by the workspace because the draw interaction lives on the map. */
  geofence: ProjectGeofence | null;
  geofenceLoading: boolean;
  geofenceError: string | null;
  geofenceDraft: { drawing: boolean; points: Position[] };
  geofenceApplying: boolean;
  geofenceRemoving: boolean;
  onGeofenceStartDrawing: () => void;
  onGeofenceCancelDrawing: () => void;
  onGeofenceApply: () => void;
  onGeofenceRemove: () => void;
  onClose: () => void;
  onSaved: (project: Project, options: { activate: boolean }) => void;
};

const tabs: { id: SettingsTab; label: string }[] = [
  { id: "identity", label: "Identitas" },
  { id: "schema", label: "Form Schema" },
  { id: "guest", label: "Guest" },
  { id: "geofence", label: "Geofence" },
];

const geometryOptions: { value: GeometryType; label: string; hint: string }[] = [
  { value: "point", label: "Point", hint: "Satu lokasi per feature" },
  { value: "line", label: "Line", hint: "Garis, misalnya jalan atau sungai" },
  { value: "polygon", label: "Polygon", hint: "Luas, misalnya area atau persawahan" },
];

const inputClass =
  "mt-1 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm text-[#1c1b19] shadow-sm outline-none transition placeholder:text-[#9c9890] focus:border-[#0f6b5f] focus:ring-2 focus:ring-[#0f6b5f]/20 disabled:cursor-not-allowed disabled:bg-[#f2f1ee]";

type DraftState = {
  name: string;
  description: string;
  geometryType: GeometryType | "";
  fields: DraftFormField[];
  slug: string;
  slugTouched: boolean;
  guestEnabled: boolean;
  consentRequired: boolean;
  consentText: string;
  privacyPolicyUrl: string;
  startsAt: string;
  endsAt: string;
};

function draftFromProject(project: Project | null): DraftState {
  if (!project) {
    return {
      name: "",
      description: "",
      geometryType: "",
      fields: [],
      slug: "",
      slugTouched: false,
      guestEnabled: false,
      consentRequired: true,
      consentText: "",
      privacyPolicyUrl: "",
      startsAt: "",
      endsAt: "",
    };
  }
  return {
    name: project.name,
    description: project.description ?? "",
    geometryType: project.geometry_type,
    fields: project.form_schema.map(storedFieldToDraft),
    slug: project.public_slug ?? "",
    slugTouched: project.public_slug !== null,
    guestEnabled: project.guest_enabled,
    consentRequired: project.guest_consent_required,
    consentText: project.guest_consent_text ?? "",
    privacyPolicyUrl: project.guest_privacy_policy_url ?? "",
    startsAt: toLocalDateTime(project.guest_starts_at),
    endsAt: toLocalDateTime(project.guest_ends_at),
  };
}

function schemasEqual(a: ProjectFormField[], b: ProjectFormField[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function ProjectSettingsDialog({
  project,
  featureCount,
  geofence,
  geofenceLoading,
  geofenceError,
  geofenceDraft,
  geofenceApplying,
  geofenceRemoving,
  onGeofenceStartDrawing,
  onGeofenceCancelDrawing,
  onGeofenceApply,
  onGeofenceRemove,
  onClose,
  onSaved,
}: ProjectSettingsDialogProps) {
  const creating = project === null;
  const [tab, setTab] = useState<SettingsTab>("identity");
  const [draft, setDraft] = useState<DraftState>(() => draftFromProject(project));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const patch = useCallback((next: Partial<DraftState>) => setDraft((current) => ({ ...current, ...next })), []);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  const validation = useMemo(
    () =>
      validateProjectDraft({
        name: draft.name,
        slug: draft.slug,
        guestEnabled: draft.guestEnabled,
        fields: draft.fields,
      }),
    [draft.fields, draft.guestEnabled, draft.name, draft.slug],
  );

  const identityValid = draft.name.trim().length > 0 && draft.geometryType !== "";
  const visibleFieldErrors = showValidation ? validation.fieldErrors : {};
  const visibleFormErrors = showValidation ? validation.formErrors : [];

  const save = async () => {
    setShowValidation(true);
    if (!validation.valid || !identityValid) {
      setError("Perbaiki isian yang ditandai sebelum menyimpan.");
      if (!draft.name.trim()) setTab("identity");
      else if (Object.keys(validation.fieldErrors).length > 0) setTab("schema");
      else setTab("guest");
      return;
    }

    const nextSchema = draftFieldsToStored(draft.fields);
    const schemaChanged = !project || !schemasEqual(nextSchema, project.form_schema);

    setSaving(true);
    setError(null);
    try {
      // Schema first: PATCH re-validates the guest configuration against the persisted schema.
      if (schemaChanged && project) await replaceProjectSchema(project.id, nextSchema);

      const guestPatch = {
        public_slug: normalizeSlug(draft.slug) || null,
        guest_enabled: draft.guestEnabled,
        guest_starts_at: toIsoDateTime(draft.startsAt),
        guest_ends_at: toIsoDateTime(draft.endsAt),
        guest_consent_required: draft.consentRequired,
        guest_consent_text: draft.consentText.trim() || null,
        guest_privacy_policy_url: draft.privacyPolicyUrl.trim() || null,
      };

      const saved = project
        ? await updateProject(project.id, {
            name: draft.name.trim(),
            description: draft.description.trim(),
            ...guestPatch,
          })
        : await createProject({
            name: draft.name.trim(),
            description: draft.description.trim() || null,
            geometry_type: draft.geometryType as GeometryType,
            form_schema: nextSchema,
            ...guestPatch,
          });

      onSaved(saved, { activate: creating });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Project tidak dapat disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const geofenceTabVisible = tab === "geofence" && !creating;
  // While the fence is being drawn the backdrop stops swallowing pointer events, so the
  // workspace map underneath stays clickable. The panel itself still captures its own.
  const mapInteractive = geofenceTabVisible && geofenceDraft.drawing;

  return (
    <div
      className={`fixed inset-0 z-50 grid items-end bg-black/35 p-0 sm:place-items-center sm:p-6 ${mapInteractive ? "pointer-events-none" : ""}`}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-settings-title"
        className="pointer-events-auto flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-black/10 bg-white shadow-[0_-12px_32px_rgba(28,27,25,0.18)] sm:max-w-3xl sm:rounded-2xl sm:shadow-[0_18px_50px_rgba(28,27,25,0.24)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f1ef] text-[#0f6b5f]" aria-hidden="true">
              <Settings2 className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#0f6b5f]">
                {creating ? "Project baru" : "Pengaturan project"}
              </p>
              <h2 id="project-settings-title" className="mt-0.5 text-lg font-semibold text-[#1c1b19]">
                {creating ? "Buat project geosiap" : project.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup pengaturan project"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-[#6b6760] transition hover:bg-[#f2f1ee] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div role="tablist" aria-label="Bagian pengaturan project" className="flex gap-1 overflow-x-auto border-b border-black/10 px-5 py-2">
          {tabs
            .filter((entry) => !creating || entry.id !== "geofence")
            .map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                id={`tab-${entry.id}`}
                aria-selected={tab === entry.id}
                aria-controls={`panel-${entry.id}`}
                onClick={() => setTab(entry.id)}
                className={`min-h-9 shrink-0 rounded-lg px-3 text-sm font-semibold transition ${
                  tab === entry.id ? "bg-[#e7f1ef] text-[#0a5049]" : "text-[#6b6760] hover:bg-[#f2f1ee]"
                }`}
              >
                {entry.label}
              </button>
            ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {error ? (
            <p
              role="alert"
              className="mb-4 flex gap-2 rounded-xl border border-[#c0392b]/25 bg-[#fff6f5] p-3 text-sm leading-5 text-[#8f2d23]"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {error}
            </p>
          ) : null}

          {tab === "identity" ? (
            <section role="tabpanel" id="panel-identity" aria-labelledby="tab-identity" className="space-y-4">
              <div>
                <label htmlFor="project-name" className="text-sm font-semibold text-[#1c1b19]">
                  Nama project <span className="text-[#c0392b]">*</span>
                </label>
                <input
                  id="project-name"
                  ref={nameRef}
                  value={draft.name}
                  disabled={saving}
                  onChange={(event) => {
                    const nextName = event.target.value;
                    patch({ name: nextName, slug: draft.slugTouched ? draft.slug : suggestSlug(nextName) });
                  }}
                  placeholder="Survei Jalan Kota"
                  aria-invalid={showValidation && !draft.name.trim()}
                  className={inputClass}
                />
                {showValidation && !draft.name.trim() ? (
                  <p className="mt-1 text-xs text-[#8f2d23]">Nama project wajib diisi.</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="project-description" className="text-sm font-semibold text-[#1c1b19]">
                  Deskripsi
                </label>
                <textarea
                  id="project-description"
                  rows={3}
                  value={draft.description}
                  disabled={saving}
                  onChange={(event) => patch({ description: event.target.value })}
                  placeholder="Keterangan singkat yang tampil di panel project."
                  className={`${inputClass} resize-y`}
                />
              </div>

              <fieldset disabled={saving}>
                <legend className="text-sm font-semibold text-[#1c1b19]">Tipe geometry</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {geometryOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-xl border p-3 transition ${
                        draft.geometryType === option.value
                          ? "border-[#0f6b5f] bg-[#f2f7f6]"
                          : "border-black/10 bg-white hover:border-[#0f6b5f]/35"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="geometry-type"
                          value={option.value}
                          checked={draft.geometryType === option.value}
                          disabled={saving || !creating}
                          onChange={() => patch({ geometryType: option.value })}
                          className="size-4 accent-[#0f6b5f]"
                        />
                        <span className="font-mono text-sm font-semibold text-[#1c1b19]">{option.label}</span>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#6b6760]">{option.hint}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-1.5 text-xs leading-5 text-[#6b6760]">
                  {creating
                    ? "Menentukan bentuk yang bisa digambar di peta."
                    : `Tipe geometry dikunci setelah project dibuat. Project ini ${project.geometry_type}.`}
                </p>
              </fieldset>

              <dl className="grid gap-2 rounded-xl border border-black/10 bg-[#fbfbfa] p-3 font-mono text-xs text-[#6b6760] sm:grid-cols-2">
                <div className="flex gap-2">
                  <dt className="opacity-70">fitur</dt>
                  <dd>{featureCount}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="opacity-70">dipublikasikan</dt>
                  <dd>{project ? (project.is_published ? "ya" : "tidak") : "-"}</dd>
                </div>
              </dl>
            </section>
          ) : null}

          {tab === "schema" ? (
            <section role="tabpanel" id="panel-schema" aria-labelledby="tab-schema">
              <ProjectFormSchemaEditor
                fields={draft.fields}
                fieldErrors={visibleFieldErrors}
                guestEnabled={draft.guestEnabled}
                disabled={saving}
                onChange={(fields) => patch({ fields })}
              />
            </section>
          ) : null}

          {tab === "guest" ? (
            <section role="tabpanel" id="panel-guest" aria-labelledby="tab-guest" className="space-y-4">
              {visibleFormErrors.length > 0 ? (
                <ul
                  role="alert"
                  className="space-y-1 rounded-xl border border-[#c0392b]/25 bg-[#fff6f5] p-3 text-sm leading-5 text-[#8f2d23]"
                >
                  {visibleFormErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              ) : null}
              <ProjectGuestSettings
                slug={draft.slug}
                enabled={draft.guestEnabled}
                consentRequired={draft.consentRequired}
                consentText={draft.consentText}
                privacyPolicyUrl={draft.privacyPolicyUrl}
                startsAt={draft.startsAt}
                endsAt={draft.endsAt}
                fields={draft.fields}
                disabled={saving}
                onChange={(next) => {
                  const updated: Partial<DraftState> = {};
                  if (next.slug !== undefined) Object.assign(updated, { slug: next.slug, slugTouched: true });
                  if (next.enabled !== undefined) updated.guestEnabled = next.enabled;
                  if (next.consentRequired !== undefined) updated.consentRequired = next.consentRequired;
                  if (next.consentText !== undefined) updated.consentText = next.consentText;
                  if (next.privacyPolicyUrl !== undefined) updated.privacyPolicyUrl = next.privacyPolicyUrl;
                  if (next.startsAt !== undefined) updated.startsAt = next.startsAt;
                  if (next.endsAt !== undefined) updated.endsAt = next.endsAt;
                  patch(updated);
                }}
              />
            </section>
          ) : null}

          {geofenceTabVisible ? (
            <section role="tabpanel" id="panel-geofence" aria-labelledby="tab-geofence">
              {geofenceLoading ? (
                <p className="py-6 text-center text-sm text-[#6b6760]">Memuat geofence…</p>
              ) : (
                <ProjectGeofenceSettings
                  geofence={geofence}
                  draftPoints={geofenceDraft.points.length}
                  drawing={geofenceDraft.drawing}
                  applying={geofenceApplying}
                  removing={geofenceRemoving}
                  error={geofenceError}
                  onStartDrawing={onGeofenceStartDrawing}
                  onCancelDrawing={onGeofenceCancelDrawing}
                  onApply={onGeofenceApply}
                  onRemove={onGeofenceRemove}
                />
              )}
            </section>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-black/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[#6b6760]">
            {geofenceTabVisible
              ? "Geofence tersimpan terpisah dari isian form project."
              : "Menyimpan menulis ke Tileserver dan langsung memengaruhi halaman /guest."}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-11 rounded-xl px-4 text-sm font-semibold text-[#6b6760] transition hover:bg-[#f2f1ee] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
            >
              Batal
            </button>
            {geofenceTabVisible ? null : (
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0f6b5f] px-4 text-sm font-semibold text-white transition hover:bg-[#0a5049] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
              >
                {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
                {saving ? "Menyimpan…" : creating ? "Buat project" : "Simpan perubahan"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
