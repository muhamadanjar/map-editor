"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, LogIn, MapPinned } from "lucide-react";
import { ProjectWorkspace } from "@/features/projects/components/project-workspace";
import type { AccountProfile, AuthenticationState } from "../types";

export function AuthenticationGate({ initialError }: { initialError?: string }) {
  const [state, setState] = useState<AuthenticationState>("loading");
  const [account, setAccount] = useState<AccountProfile>({ name: null, email: null });

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!active) return;
        if (response.status === 401) setState("unauthenticated");
        else if (response.ok) {
          const result: unknown = await response.json();
          const payload = result && typeof result === "object" ? result as Record<string, unknown> : {};
          const value = payload.account && typeof payload.account === "object" ? payload.account as Record<string, unknown> : {};
          setAccount({
            name: typeof value.name === "string" ? value.name : null,
            email: typeof value.email === "string" ? value.email : null,
          });
          setState("authenticated");
        }
        else setState("unavailable");
      })
      .catch(() => { if (active) setState("unavailable"); });
    return () => { active = false; };
  }, []);

  if (state === "authenticated") return <ProjectWorkspace account={account} />;

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f6f6f5] p-4 text-[#1c1b19]">
      <section className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-[0_12px_36px_rgba(28,27,25,0.14)] sm:p-8">
        <span className="grid size-11 place-items-center rounded-xl bg-[#e7f1ef] text-[#0f6b5f]" aria-hidden="true"><MapPinned className="size-5" /></span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#0f6b5f]">Map Editor</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Masuk untuk membuka editor</h1>
        <p className="mt-2 text-sm leading-6 text-[#6b6760]">Gunakan akun UserManagement untuk mengelola Project dan data peta.</p>
        {state === "loading" ? (
          <p role="status" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm text-[#6b6760]"><LoaderCircle className="size-4 animate-spin" /> Memeriksa sesi…</p>
        ) : (
          <>
            {initialError ? <p role="alert" className="mt-5 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm text-[#8f2d23]">{initialError}</p> : null}
            {state === "unavailable" ? <p role="alert" className="mt-5 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm text-[#8f2d23]">Layanan autentikasi belum tersedia. Periksa konfigurasi Map Editor dan UserManagement.</p> : null}
            <a href="/api/auth/login" className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0f6b5f] px-4 text-sm font-semibold text-white transition hover:bg-[#0a5049] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"><LogIn className="size-4" aria-hidden="true" /> Masuk dengan UserManagement</a>
            {process.env.NEXT_PUBLIC_USERMANAGEMENT_GOOGLE_SIGN_IN_ENABLED === "true" ? (
              <a href="/api/auth/google" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-4 text-sm font-semibold text-[#1c1b19] transition hover:bg-[#f2f1ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">Masuk dengan Google</a>
            ) : null}
            {state === "unauthenticated" ? <p className="mt-3 text-center text-xs leading-5 text-[#6b6760]">Kredensial dimasukkan di halaman aman UserManagement.</p> : null}
          </>
        )}
      </section>
    </main>
  );
}
