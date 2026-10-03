import {
  Eraser,
  MapPin,
  Merge,
  MousePointer2,
  Pentagon,
  RectangleHorizontal,
  Redo2,
  Scissors,
  Undo2,
  Waypoints,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { GeometryType } from "../types";

export type MapEditorMode = "select" | "point" | "linestring" | "polygon" | "rectangle";

type Tool = {
  mode: MapEditorMode;
  label: string;
  geometry?: GeometryType;
  Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

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
  onModeChange: (mode: MapEditorMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canCut: boolean;
  canMerge: boolean;
  onCut: () => void;
  onMerge: () => void;
};

const controlClass =
  "grid size-11 place-items-center transition focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0f6b5f] disabled:cursor-not-allowed disabled:opacity-40";

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={active || undefined}
          disabled={disabled}
          onClick={onClick}
          className={`${controlClass} ${active ? "bg-[#e7f1ef] text-[#0a5049]" : "text-[#1c1b19] hover:bg-[#f2f1ee]"}`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={8}>{label}</TooltipContent>
    </Tooltip>
  );
}

export function MapEditingToolbar({
  geometryType,
  activeMode,
  hasDraft,
  canUndo,
  canRedo,
  onModeChange,
  onUndo,
  onRedo,
  onClear,
  canCut,
  canMerge,
  onCut,
  onMerge,
}: EditingToolbarProps) {
  const geometryName = geometryType === "point" ? "titik" : geometryType === "line" ? "garis" : "poligon";

  return (
    <TooltipProvider>
      <nav aria-label="Peralatan editor peta" className="absolute right-3 top-72 z-10 overflow-hidden rounded-xl border border-black/10 bg-white/95 shadow-[0_5px_16px_rgba(28,27,25,0.14)] backdrop-blur sm:right-5">
        <ToolbarButton label="Pilih dan edit vertex" active={activeMode === "select"} disabled={!hasDraft} onClick={() => onModeChange("select")}>
          <MousePointer2 className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <div className="border-t border-black/10" />
        {drawingTools.map(({ mode, label, geometry, Icon }) => {
          const unavailable = geometry !== geometryType;
          const disabled = unavailable || hasDraft;
          const tooltip = unavailable
            ? `${label} tidak tersedia: Project ini hanya menerima ${geometryName}.`
            : hasDraft
              ? "Selesaikan, edit, atau hapus sketsa sebelum membuat geometry baru."
              : label;
          return (
            <ToolbarButton key={mode} label={tooltip} active={activeMode === mode} disabled={disabled} onClick={() => onModeChange(mode)}>
              <Icon className="size-4" aria-hidden />
            </ToolbarButton>
          );
        })}
        <div className="border-t border-black/10" />
        <ToolbarButton label="Urungkan perubahan sketsa" disabled={!canUndo} onClick={onUndo}>
          <Undo2 className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Ulangi perubahan sketsa" disabled={!canRedo} onClick={onRedo}>
          <Redo2 className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Hapus sketsa aktif" disabled={!hasDraft} onClick={onClear}>
          <Eraser className="size-4 text-[#c0392b]" aria-hidden="true" />
        </ToolbarButton>
        <div className="border-t border-black/10" />
        <ToolbarButton label={canCut ? "Potong Feature terpilih" : "Pilih satu Feature Polygon untuk dipotong"} disabled={!canCut} onClick={onCut}>
          <Scissors className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label={canMerge ? "Gabungkan Feature terpilih" : "Pilih dua atau lebih Feature Polygon untuk digabungkan"} disabled={!canMerge} onClick={onMerge}>
          <Merge className="size-4" aria-hidden="true" />
        </ToolbarButton>
      </nav>
    </TooltipProvider>
  );
}
