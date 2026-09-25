import { Compass, LocateFixed, Minus, Plus } from "lucide-react";

type MapNavigationControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetNorth: () => void;
  onFocusWorkspace: () => void;
};

const controlClass = "grid size-11 place-items-center text-[#1c1b19] transition hover:bg-[#f2f1ee] focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0f6b5f]";

export function MapNavigationControls({ onZoomIn, onZoomOut, onResetNorth, onFocusWorkspace }: MapNavigationControlsProps) {
  return (
    <nav aria-label="Navigasi peta" className="absolute right-3 top-20 z-10 overflow-hidden rounded-xl border border-black/10 bg-white/95 shadow-[0_5px_16px_rgba(28,27,25,0.14)] backdrop-blur sm:right-5">
      <button type="button" onClick={onZoomIn} aria-label="Perbesar peta" title="Perbesar peta" className={`${controlClass} border-b border-black/10`}>
        <Plus className="size-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={onZoomOut} aria-label="Perkecil peta" title="Perkecil peta" className={`${controlClass} border-b border-black/10`}>
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={onResetNorth} aria-label="Kembalikan orientasi utara" title="Kembalikan orientasi utara" className={`${controlClass} border-b border-black/10`}>
        <Compass className="size-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={onFocusWorkspace} aria-label="Fokus seluruh workspace" title="Fokus seluruh workspace" className={`${controlClass} text-[#0f6b5f]`}>
        <LocateFixed className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
