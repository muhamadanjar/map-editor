"use client";

import { AlertCircle, LoaderCircle, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/button";
import { GuestApiError, getGuestProject } from "../api/guest-api";
import type { GuestProject } from "../types";
import { GuestSubmissionForm } from "../components/guest-submission-form";

type GuestSubmissionViewProps = {
  slug: string;
};

export function GuestSubmissionView({ slug }: GuestSubmissionViewProps) {
  const [project, setProject] = useState<GuestProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProject = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProject(await getGuestProject(slug));
    } catch (caught) {
      setProject(null);
      if (caught instanceof GuestApiError && caught.status === 404) {
        setError("Formulir ini tidak tersedia, belum dibuka, atau sudah ditutup.");
      } else if (caught instanceof GuestApiError && caught.status === 409) {
        setError("Formulir ini sedang tidak dapat diisi. Hubungi pengelola project.");
      } else {
        setError(caught instanceof Error ? caught.message : "Project tidak dapat dimuat. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const task = window.setTimeout(() => {
      void loadProject();
    }, 0);
    return () => window.clearTimeout(task);
  }, [loadProject]);

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#f7f6f3] px-4">
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm font-medium text-[#4f4b45] shadow-sm">
          <LoaderCircle className="size-5 animate-spin text-[#0f6b5f]" aria-hidden="true" />
          Menyiapkan formulir…
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main id="main-content" tabIndex={-1} className="grid min-h-dvh place-items-center bg-[#f7f6f3] px-4 py-10 outline-none">
        <section className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-7 text-center shadow-[0_18px_50px_rgba(28,27,25,0.12)] sm:p-10">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#fff1ef] text-[#8f2d23]">
            <AlertCircle className="size-7" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#1c1b19]">Formulir belum tersedia</h1>
          <p className="mt-3 text-base leading-7 text-[#6b6760]">{error}</p>
          <Button type="button" variant="primary" onClick={() => void loadProject()} className="mt-6 min-h-11 gap-2">
            <RefreshCcw className="size-4" aria-hidden="true" />
            Coba lagi
          </Button>
        </section>
      </main>
    );
  }

  return <GuestSubmissionForm project={project} slug={slug} />;
}
