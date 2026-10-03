"use client";

import {
  ChevronDown, Eraser, MapPin, Merge, MousePointer2, Pentagon,
  RectangleHorizontal, Redo2, Scissors, Table2, Trash2, Undo2, Waypoints, Wrench,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { GeometryType } from "../types";

export type MapEditorMode = "select" | "point" | "linestring" | "polygon" | "rectangle";

type Tool = { mode: MapEditorMode; label: string; geometry?: GeometryType; Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; };

const drawingTools: Tool[] = [
  { mode: "point", label: "Gambar titik", geometry: "point", Icon: MapPin },
  { mode: "linestring", label: "Gambar garis", geometry: "line", Icon: Waypoints },
  { mode: "polygon", label: "Gambar poligon", geometry: "polygon", Icon: Pentagon },
  { mode: "rectangle", label: "Gambar rectangle", geometry: "polygon", Icon: RectangleHorizontal },
];

type EditingToolbarProps = {
  geometryType: GeometryType;
  activeMode: MapEditorMode | null;
  hasDraft: boolean;
  canUndo: boolean;
  canRedo: boolean;
  featureSelectionMode: boolean;
  selectedFeatureCount: number;
  tableOpen: boolean;
  onModeChange: (mode: MapEditorMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onFeatureSelectionModeChange: (active: boolean) => void;
  onTableToggle: () => void;
  canDelete: boolean;
  onDelete: () => void;
  canCut: boolean;
  canMerge: boolean;
  onCut: () => void;
  onMerge: () => void;
};

const controlClass = "grid size-11 shrink-0 place-items-center rounded-lg transition-[background-color,color,transform] duration-200 active:scale-[0.96] focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f] disabled:cursor-not-allowed disabled:opacity-40";

function ToolbarButton({ label, active = false, disabled = false, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode; }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={label} aria-pressed={active || undefined} disabled={disabled} onClick={onClick} className={`${controlClass} ${active ? "bg-[#e7f1ef] text-[#0a5049]" : "text-[#1c1b19] hover:bg-[#f2f1ee]"}`}>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>{label}</TooltipContent>
    </Tooltip>
  );
}

export function MapEditingToolbar({ geometryType, activeMode, hasDraft, canUndo, canRedo, featureSelectionMode, selectedFeatureCount, tableOpen, onModeChange, onUndo, onRedo, onClear, onFeatureSelectionModeChange, onTableToggle, canDelete, onDelete, canCut, canMerge, onCut, onMerge }: EditingToolbarProps) {
  const [expanded, setExpanded] = useState(false);
  const geometryName = geometryType === "point" ? "titik" : geometryType === "line" ? "garis" : "poligon";

  return (
    <TooltipProvider>
      <nav aria-label="Dock peralatan editor peta" className="absolute inset-x-3 bottom-3 z-20 flex justify-center sm:inset-x-5 sm:bottom-5">
        <div className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-xl border border-black/10 bg-white/95 p-1.5 shadow-[0_5px_16px_rgba(28,27,25,0.14)] backdrop-blur">
          <ToolbarButton label={expanded ? "Ringkas dock editor" : "Buka peralatan editor"} active={expanded} onClick={() => setExpanded((current) => !current)}>
            {expanded ? <ChevronDown className="size-4" aria-hidden="true" /> : <Wrench className="size-4" aria-hidden="true" />}
          </ToolbarButton>
          <ToolbarButton label={tableOpen ? "Sembunyikan tabel data tersimpan" : "Tampilkan tabel data tersimpan"} active={tableOpen} onClick={onTableToggle}>
            <Table2 className="size-4" aria-hidden="true" />
          </ToolbarButton>

          {expanded ? (
            <>
              <span className="h-6 border-l border-black/10" aria-hidden="true" />
              <ToolbarButton label={hasDraft ? "Pilih dan edit vertex sketsa" : "Pilih Feature tersimpan di peta"} active={hasDraft ? activeMode === "select" : featureSelectionMode} onClick={() => hasDraft ? onModeChange("select") : onFeatureSelectionModeChange(!featureSelectionMode)}>
                <MousePointer2 className="size-4" aria-hidden="true" />
              </ToolbarButton>
              {selectedFeatureCount > 0 ? <span aria-live="polite" className="px-2 font-mono text-xs font-semibold text-[#8f2d23]">{selectedFeatureCount} dipilih</span> : null}
              {drawingTools.map(({ mode, label, geometry, Icon }) => {
                const unavailable = geometry !== geometryType;
                const disabled = unavailable || hasDraft;
                const tooltip = unavailable ? `${label} tidak tersedia: Project ini hanya menerima ${geometryName}.` : hasDraft ? "Selesaikan, edit, atau hapus sketsa sebelum membuat geometry baru." : label;
                return <ToolbarButton key={mode} label={tooltip} active={activeMode === mode} disabled={disabled} onClick={() => onModeChange(mode)}><Icon className="size-4" aria-hidden /></ToolbarButton>;
              })}
              <span className="h-6 border-l border-black/10" aria-hidden="true" />
              <ToolbarButton label="Urungkan perubahan sketsa" disabled={!canUndo} onClick={onUndo}><Undo2 className="size-4" aria-hidden="true" /></ToolbarButton>
              <ToolbarButton label="Ulangi perubahan sketsa" disabled={!canRedo} onClick={onRedo}><Redo2 className="size-4" aria-hidden="true" /></ToolbarButton>
              <ToolbarButton label="Hapus sketsa aktif" disabled={!hasDraft} onClick={onClear}><Eraser className="size-4 text-[#c0392b]" aria-hidden="true" /></ToolbarButton>
              <span className="h-6 border-l border-black/10" aria-hidden="true" />
              <ToolbarButton label={canDelete ? "Hapus Feature terpilih" : "Pilih satu atau lebih Feature untuk dihapus"} disabled={!canDelete} onClick={onDelete}><Trash2 className="size-4 text-[#c0392b]" aria-hidden="true" /></ToolbarButton>
              <ToolbarButton label={canCut ? "Potong Feature terpilih" : "Pilih satu Feature Polygon untuk dipotong"} disabled={!canCut} onClick={onCut}><Scissors className="size-4" aria-hidden="true" /></ToolbarButton>
              <ToolbarButton label={canMerge ? `Gabungkan ${selectedFeatureCount} Feature terpilih` : "Pilih dua atau lebih Feature Polygon untuk digabungkan"} disabled={!canMerge} onClick={onMerge}><Merge className="size-4" aria-hidden="true" /></ToolbarButton>
            </>
          ) : null}
        </div>
      </nav>
    </TooltipProvider>
  );
}
