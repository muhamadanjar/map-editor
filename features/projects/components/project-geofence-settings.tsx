"use client";

import { Pentagon, Trash2, X } from "lucide-react";
import { ProjectsApiError } from "../api/projects-api";
import type { ProjectGeofence } from "../types";
import { geofenceExclusionCount } from "../utils/project-validation";

type ProjectGeofenceSettingsProps = {
  geofence: ProjectGeofence | null;
  draftPoints: number;
  drawing: boolean;
  applying: boolean;
  removing: boolean;
  error: string | null;
  onStartDrawing: () => void;
  onCancelDrawing: () => void;
  onApply: () => void;
  onRemove: () => void;
};

function bboxLabel(geofence: ProjectGeofence): string {
  const [west, south, east, north] = geofence.bbox;
  if ([west, south, east, north].some((value) => typeof value !== "number")) return "-";
  return `${west.toFixed(4)}, ${south.toFixed(4)} → ${east.toFixed(4)}, ${north.toFixed(4)}`;
}

function vertexCount(geofence: ProjectGeofence | null): number {
  const geometry = geofence?.geometry;
  if (!geometry || geometry.type !== "Polygon") return 0;
  return geometry.coordinates[0]?.length ?? 0;
}

export function ProjectGeofenceSettings({
  geofence,
  draftPoints,
  drawing,
  applying,
  removing,
  error,
  onStartDrawing,
  onCancelDrawing,
  onApply,
  onRemove,
}: ProjectGeofenceSettingsProps) {
  const enoughPoints = draftPoints >= 3;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/10 bg-[#fbfbfa] p-3">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eef3f7] text-[#2f5d7c]" aria-hidden="true">
            <Pentagon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1c1b19]">Batas area yang diizinkan</p>
            <p className="mt-0.5 text-sm leading-5 text-[#6b6760]">
              Feature dan kiriman guest yang keluar dari poligon ini ditolak Tileserver dengan 422. Kosongkan bila project
              tidak perlu batas.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-[#c0392b]/25 bg-[#fff6f5] p-3 text-sm leading-5 text-[#8f2d23]">
          {error}
        </p>
      ) : null}

      {geofence ? (
        <div className="rounded-xl border border-[#67a2c5]/40 bg-[#eef3f7] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5d7c]">Geofence tersimpan</p>
          <dl className="mt-2 space-y-1 font-mono text-xs text-[#2f5d7c]">
            <div className="flex gap-2">
              <dt className="opacity-70">tipe</dt>
              <dd>{geofence.geometry.type}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="opacity-70">sisi</dt>
              <dd>{vertexCount(geofence)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="opacity-70">bbox</dt>
              <dd className="min-w-0 break-all">{bboxLabel(geofence)}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-black/15 bg-[#fbfbfa] px-4 py-6 text-center text-sm text-[#6b6760]">
          Belum ada geofence. Feature bebas digambar di seluruh area peta.
        </p>
      )}

      {drawing ? (
        <div className="space-y-2 rounded-xl border border-[#67a2c5]/40 bg-white p-3">
          <p className="text-sm leading-5 text-[#1c1b19]">
            Klik langsung di peta di belakang dialog ini untuk menambahkan titik batas. Minimal tiga titik.
            <span className="ml-1 font-mono text-xs text-[#2f5d7c]">{draftPoints} titik</span>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={!enoughPoints || applying}
              onClick={onApply}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#0f6b5f] px-3 text-sm font-semibold text-white transition hover:bg-[#0a5049] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
            >
              Terapkan geofence
            </button>
            <button
              type="button"
              disabled={applying}
              onClick={onCancelDrawing}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-3 text-sm font-semibold text-[#6b6760] transition hover:bg-[#f2f1ee] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
            >
              <X className="size-4" aria-hidden="true" /> Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={applying || removing}
            onClick={onStartDrawing}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-3 text-sm font-semibold text-[#0f6b5f] transition hover:bg-[#f2f7f6] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
          >
            <Pentagon className="size-4" aria-hidden="true" /> {geofence ? "Gambar ulang di peta" : "Gambar di peta"}
          </button>
          {geofence ? (
            <button
              type="button"
              disabled={applying || removing}
              onClick={onRemove}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#c0392b]/30 px-3 text-sm font-semibold text-[#c0392b] transition hover:bg-[#fff6f5] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c0392b]"
            >
              <Trash2 className="size-4" aria-hidden="true" /> {removing ? "Menghapus…" : "Hapus geofence"}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function geofenceErrorMessage(error: unknown): string {
  if (error instanceof ProjectsApiError) {
    const excluded = geofenceExclusionCount(error.detail);
    if (excluded !== null) {
      return `${excluded} Feature yang sudah ada berada di luar batas ini. Perbesar poligon atau hapus geofence.`;
    }
  }
  return error instanceof Error ? error.message : "Geofence tidak dapat disimpan.";
}
