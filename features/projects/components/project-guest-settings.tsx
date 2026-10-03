"use client";

import { Check, Copy, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { DraftFormField } from "../types";
import { guestAvailability, isValidSlug, normalizeSlug } from "../utils/project-validation";

type ProjectGuestSettingsProps = {
  slug: string;
  enabled: boolean;
  consentRequired: boolean;
  consentText: string;
  privacyPolicyUrl: string;
  startsAt: string;
  endsAt: string;
  fields: DraftFormField[];
  disabled: boolean;
  onChange: (patch: {
    slug?: string;
    enabled?: boolean;
    consentRequired?: boolean;
    consentText?: string;
    privacyPolicyUrl?: string;
    startsAt?: string;
    endsAt?: string;
  }) => void;
};

const inputClass =
  "mt-1 min-h-10 w-full rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-sm text-[#1c1b19] outline-none transition focus:border-[#0f6b5f] focus:ring-2 focus:ring-[#0f6b5f]/20 disabled:cursor-not-allowed disabled:bg-[#f2f1ee]";

const stateStyles = {
  open: "border-[#0f6b5f]/30 bg-[#e7f1ef] text-[#0a5049]",
  scheduled: "border-[#67a2c5]/40 bg-[#eef3f7] text-[#2f5d7c]",
  ended: "border-black/15 bg-[#f2f1ee] text-[#6b6760]",
  disabled: "border-[#c0392b]/25 bg-[#fff6f5] text-[#8f2d23]",
} as const;

const stateLabels = {
  open: "Terbuka",
  scheduled: "Terjadwal",
  ended: "Ditutup",
  disabled: "Nonaktif",
} as const;

export function ProjectGuestSettings({
  slug,
  enabled,
  consentRequired,
  consentText,
  privacyPolicyUrl,
  startsAt,
  endsAt,
  fields,
  disabled,
  onChange,
}: ProjectGuestSettingsProps) {
  const [now, setNow] = useState(() => new Date());
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, [enabled]);

  const normalized = normalizeSlug(slug);
  const slugValid = !normalized || isValidSlug(normalized);
  const hasFileField = fields.some((field) => field.type === "file");
  const guestPath = normalized ? `/guest/${normalized}` : "";
  // Deriving instead of resetting through an effect: the flag belongs to a path, not to the panel.
  const copied = copiedPath === guestPath;

  // Preview the resulting state, not the persisted one, so the status updates as the form is edited.
  const availability = guestAvailability(
    {
      guest_enabled: enabled,
      public_slug: normalized || null,
      guest_starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      guest_ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    },
    now,
  );

  const copyLink = async () => {
    const absolute = `${window.location.origin}${guestPath}`;
    try {
      await navigator.clipboard.writeText(absolute);
      setCopiedPath(guestPath);
    } catch {
      setCopiedPath(null);
    }
  };

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 rounded-xl border border-black/10 bg-[#fbfbfa] p-3">
        <input
          type="checkbox"
          checked={enabled}
          disabled={disabled}
          onChange={(event) => onChange({ enabled: event.target.checked })}
          className="mt-0.5 size-4 rounded border-black/25 accent-[#0f6b5f]"
        />
        <span>
          <span className="block text-sm font-semibold text-[#1c1b19]">Aktifkan formulir guest publik</span>
          <span className="mt-0.5 block text-sm leading-5 text-[#6b6760]">
            Tanpa ini, halaman <span className="font-mono">/guest/&#123;slug&#125;</span> membalas 404 karena Tileserver hanya
            membuka project yang punya slug dan guest aktif.
          </span>
        </span>
      </label>

      <div>
        <label htmlFor="project-slug" className="text-sm font-semibold text-[#1c1b19]">
          Slug publik
        </label>
        <input
          id="project-slug"
          value={slug}
          disabled={disabled}
          spellCheck={false}
          onChange={(event) => onChange({ slug: event.target.value })}
          placeholder="survei-jalan-2026"
          aria-invalid={!slugValid}
          className={`${inputClass} font-mono`}
        />
        <p className="mt-1 text-xs leading-5 text-[#6b6760]">
          {slugValid
            ? "Huruf kecil, angka, dan tanda hubung tunggal. Tautan bersifat publik."
            : "Hanya huruf kecil, angka, dan tanda hubung tunggal yang diizinkan."}
        </p>
      </div>

      {normalized ? (
        <div className={`rounded-xl border p-3 ${stateStyles[availability.state]}`} role="status">
          <p className="text-xs font-semibold uppercase tracking-[0.14em]">{stateLabels[availability.state]}</p>
          <p className="mt-1 text-sm leading-5">{availability.message}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-white/70 px-2 py-1.5 font-mono text-xs">{guestPath}</code>
            <button
              type="button"
              disabled={disabled}
              onClick={() => void copyLink()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white px-2.5 text-xs font-semibold text-[#0f6b5f] shadow-sm transition hover:bg-[#f2f7f6] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
            >
              {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
              {copied ? "Tersalin" : "Salin tautan"}
            </button>
            <a
              href={guestPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white px-2.5 text-xs font-semibold text-[#0f6b5f] shadow-sm transition hover:bg-[#f2f7f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
            >
              <Link2 className="size-3.5" aria-hidden="true" /> Buka
            </a>
          </div>
        </div>
      ) : null}

      {hasFileField ? (
        <p className="rounded-xl border border-[#c0392b]/25 bg-[#fff6f5] p-3 text-sm leading-5 text-[#8f2d23]">
          Schema memiliki kolom file, jadi formulir guest akan membalas 409 dan tidak bisa diisi. Hapus kolom file dari tab
          Form Schema, atau biarkan guest nonaktif.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="project-guest-starts" className="text-sm font-semibold text-[#1c1b19]">
            Buka mulai
          </label>
          <input
            id="project-guest-starts"
            type="datetime-local"
            value={startsAt}
            disabled={disabled}
            onChange={(event) => onChange({ startsAt: event.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="project-guest-ends" className="text-sm font-semibold text-[#1c1b19]">
            Tutup pada
          </label>
          <input
            id="project-guest-ends"
            type="datetime-local"
            value={endsAt}
            disabled={disabled}
            onChange={(event) => onChange({ endsAt: event.target.value })}
            className={inputClass}
          />
        </div>
      </div>
      <p className="-mt-2 text-xs leading-5 text-[#6b6760]">Kosongkan keduanya untuk formulir yang selalu terbuka.</p>

      <label className="flex items-start gap-3 rounded-xl border border-black/10 bg-[#fbfbfa] p-3">
        <input
          type="checkbox"
          checked={consentRequired}
          disabled={disabled}
          onChange={(event) => onChange({ consentRequired: event.target.checked })}
          className="mt-0.5 size-4 rounded border-black/25 accent-[#0f6b5f]"
        />
        <span>
          <span className="block text-sm font-semibold text-[#1c1b19]">Wajibkan persetujuan data</span>
          <span className="mt-0.5 block text-sm leading-5 text-[#6b6760]">
            Guest harus menyetujui sebelum mengirim data pribadinya.
          </span>
        </span>
      </label>

      <div>
        <label htmlFor="project-consent-text" className="text-sm font-semibold text-[#1c1b19]">
          Teks persetujuan
        </label>
        <textarea
          id="project-consent-text"
          rows={3}
          value={consentText}
          disabled={disabled}
          onChange={(event) => onChange({ consentText: event.target.value })}
          placeholder="Saya setuju data saya digunakan untuk keperluan survei kota."
          className={`${inputClass} resize-y`}
        />
      </div>

      <div>
        <label htmlFor="project-privacy-url" className="text-sm font-semibold text-[#1c1b19]">
          Tautan kebijakan privasi
        </label>
        <input
          id="project-privacy-url"
          type="url"
          inputMode="url"
          value={privacyPolicyUrl}
          disabled={disabled}
          onChange={(event) => onChange({ privacyPolicyUrl: event.target.value })}
          placeholder="https://contoh.go.id/privasi"
          className={inputClass}
        />
      </div>
    </div>
  );
}
