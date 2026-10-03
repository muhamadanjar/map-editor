"use client";

import { Check, ChevronLeft, CircleAlert, LoaderCircle, MailCheck, MapPin, RefreshCcw, Send, ShieldCheck, UserRound, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Button from "@/components/ui/button";
import type { FeatureGeometry, Position } from "@/features/projects/types";
import { GuestApiError, createGuestSession, requestGuestOtp, submitGuestSubmission, verifyGuestOtp } from "../api/guest-api";
import type { GuestIdentity, GuestProject, GuestSubmission } from "../types";
import { GuestDrawMap } from "./guest-draw-map";

type Step = "identity" | "verify" | "form" | "review" | "success";

type GuestSubmissionFormProps = {
  project: GuestProject;
  slug: string;
};

const initialIdentity: GuestIdentity = {
  full_name: "",
  email: "",
  phone: "",
  organization: "",
  consent: false,
};

const inputClass = "mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-base text-[#1c1b19] shadow-sm outline-none transition placeholder:text-[#9c9890] focus:border-[#0f6b5f] focus:ring-2 focus:ring-[#0f6b5f]/20 disabled:cursor-not-allowed disabled:bg-[#f2f1ee]";

function geometryLabel(geometry: FeatureGeometry | null): string {
  if (!geometry) return "Belum ada geometry";
  if (geometry.type === "Point") return "1 titik lokasi";
  if (geometry.type === "LineString") return `${geometry.coordinates.length} titik garis`;
  return `${geometry.coordinates[0].length - 1} titik area`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Permintaan tidak dapat diproses. Coba lagi.";
}

function StepIndicator({ current, otpRequired }: { current: Step; otpRequired: boolean }) {
  const steps: Array<{ id: Step; label: string; icon: typeof UserRound }> = [
    { id: "identity", label: "Data diri", icon: UserRound },
    { id: "verify", label: "Verifikasi", icon: MailCheck },
    { id: "form", label: "Lokasi & data", icon: MapPin },
    { id: "review", label: "Konfirmasi", icon: ShieldCheck },
  ];
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === current));
  return (
    <ol aria-label="Tahapan pengisian" className="grid grid-cols-4 gap-1.5 sm:gap-3">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const done = current !== "success" && index < activeIndex;
        const active = step.id === current || (step.id === "verify" && !otpRequired && activeIndex > 1);
        return (
          <li key={step.id} className="min-w-0">
            <div className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold ${active ? "bg-[#e7f1ef] text-[#0a5049]" : done ? "bg-[#f2f1ee] text-[#4a756f]" : "bg-[#f7f6f3] text-[#77736c]"}`}>
              {done ? <Check className="size-3.5" aria-hidden="true" /> : <Icon className="size-3.5" aria-hidden="true" />}
              <span className="truncate">{step.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function GuestSubmissionForm({ project, slug }: GuestSubmissionFormProps) {
  const [step, setStep] = useState<Step>("identity");
  const [identity, setIdentity] = useState<GuestIdentity>(initialIdentity);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [coordinates, setCoordinates] = useState<Position[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submission, setSubmission] = useState<GuestSubmission | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const draftGeometry = useMemo<FeatureGeometry | null>(() => {
    if (coordinates.length === 0) return null;
    if (project.geometry_type === "point") return { type: "Point", coordinates: coordinates[0] };
    if (coordinates.length === 1) return { type: "Point", coordinates: coordinates[0] };
    if (project.geometry_type === "line") return { type: "LineString", coordinates };
    return { type: "LineString", coordinates };
  }, [coordinates, project.geometry_type]);

  const completedGeometry = useMemo<FeatureGeometry | null>(() => {
    if (project.geometry_type === "point") return coordinates[0] ? { type: "Point", coordinates: coordinates[0] } : null;
    if (project.geometry_type === "line") return coordinates.length >= 2 ? { type: "LineString", coordinates } : null;
    return coordinates.length >= 3 ? { type: "Polygon", coordinates: [[...coordinates, coordinates[0]]] } : null;
  }, [coordinates, project.geometry_type]);

  const showError = (message: string, errors: Record<string, string> = {}) => {
    setError(message);
    setFieldErrors(errors);
    requestAnimationFrame(() => errorSummaryRef.current?.focus());
  };

  const updateIdentity = <K extends keyof GuestIdentity>(key: K, value: GuestIdentity[K]) => {
    setIdentity((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));
  };

  const validateIdentity = () => {
    const nextErrors: Record<string, string> = {};
    if (!identity.full_name.trim()) nextErrors.full_name = "Masukkan nama lengkap Anda.";
    if (!/^\S+@\S+\.\S+$/.test(identity.email.trim())) nextErrors.email = "Masukkan alamat email yang valid.";
    if (!identity.phone.trim()) nextErrors.phone = "Masukkan nomor telepon atau WhatsApp.";
    if (!identity.organization.trim()) nextErrors.organization = "Masukkan instansi atau organisasi.";
    if (project.guest_consent_required && !identity.consent) nextErrors.consent = "Persetujuan penggunaan data diperlukan.";
    return nextErrors;
  };

  const handleIdentity = async () => {
    const nextErrors = validateIdentity();
    if (Object.keys(nextErrors).length) {
      showError("Periksa kembali data diri yang wajib diisi.", nextErrors);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const guestSession = await createGuestSession(slug, identity);
      setSessionToken(guestSession.session_token);
      setIdempotencyKey(crypto.randomUUID());
      if (guestSession.otp_required) {
        await requestGuestOtp(guestSession.session_token);
        setStep("verify");
      } else {
        setStep("form");
      }
    } catch (caught) {
      if (caught instanceof GuestApiError && caught.status === 409 && typeof caught.detail === "object" && caught.detail) {
        const referenceCode = (caught.detail as { reference_code?: string }).reference_code;
        if (referenceCode) {
          setSubmission({ submission_id: "", feature_id: "", reference_code: referenceCode, submitted_at: "", status: "already_submitted" });
          setStep("success");
          return;
        }
      }
      showError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (!sessionToken) return;
    if (otpCode.trim().length < 4) {
      showError("Masukkan kode OTP yang dikirim ke email Anda.", { otp: "Kode OTP belum lengkap." });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await verifyGuestOtp(sessionToken, otpCode.trim());
      if (!result.verified) throw new Error("Kode OTP belum terverifikasi.");
      setStep("form");
    } catch (caught) {
      showError(errorMessage(caught), { otp: errorMessage(caught) });
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    if (!sessionToken) return;
    setBusy(true);
    setError(null);
    try {
      await requestGuestOtp(sessionToken);
    } catch (caught) {
      showError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const onCoordinate = (coordinate: Position) => {
    setError(null);
    if (project.geometry_type === "point") {
      setCoordinates([coordinate]);
      setDrawing(false);
      return;
    }
    setCoordinates((current) => [...current, coordinate]);
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!completedGeometry) nextErrors.geometry = `Selesaikan geometry ${project.geometry_type} terlebih dahulu.`;
    project.form_schema.forEach((field) => {
      if (field.required && !attributes[field.name]?.trim()) nextErrors[field.name] = `${field.label} wajib diisi.`;
    });
    return nextErrors;
  };

  const continueToReview = () => {
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length) {
      showError("Lengkapi lokasi dan data yang wajib diisi.", nextErrors);
      return;
    }
    setError(null);
    setFieldErrors({});
    setStep("review");
  };

  const submit = async () => {
    if (!sessionToken || !completedGeometry || !idempotencyKey) return;
    setBusy(true);
    setError(null);
    const typedAttributes = Object.fromEntries(project.form_schema.map((field) => {
      const value = attributes[field.name] ?? "";
      return [field.name, field.type === "number" && value !== "" ? Number(value) : value || null];
    }));
    try {
      const result = await submitGuestSubmission(sessionToken, {
        geometry: completedGeometry,
        attributes: typedAttributes,
        idempotency_key: idempotencyKey,
      });
      setSubmission(result);
      setStep("success");
    } catch (caught) {
      if (caught instanceof GuestApiError && caught.status === 409 && typeof caught.detail === "object" && caught.detail) {
        const referenceCode = (caught.detail as { reference_code?: string }).reference_code;
        if (referenceCode) {
          setSubmission({ submission_id: "", feature_id: "", reference_code: referenceCode, submitted_at: "", status: "already_submitted" });
          setStep("success");
          return;
        }
      }
      showError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  if (step === "success" && submission) {
    const duplicate = submission.status === "already_submitted";
    return (
      <main id="main-content" tabIndex={-1} className="mx-auto grid min-h-dvh max-w-2xl place-items-center px-4 py-10 outline-none">
        <section className="w-full rounded-3xl border border-black/10 bg-white p-6 text-center shadow-[0_18px_50px_rgba(28,27,25,0.12)] sm:p-10">
          <div className={`mx-auto grid size-14 place-items-center rounded-2xl ${duplicate ? "bg-[#f2f1ee] text-[#6b6760]" : "bg-[#e7f1ef] text-[#0a5049]"}`}>
            <Check className="size-7" aria-hidden="true" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#0f6b5f]">{project.name}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1c1b19]">{duplicate ? "Data sudah pernah dikirim" : "Terima kasih, data Anda sudah terkirim"}</h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-[#6b6760]">{duplicate ? "Alamat email ini sudah memiliki satu submission untuk project ini." : "Submission Anda telah dicatat dan akan tersedia untuk pengelola project."}</p>
          <div className="mt-6 rounded-2xl bg-[#f7f6f3] px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#6b6760]">Kode referensi</p>
            <p className="mt-1 font-mono text-lg font-semibold text-[#1c1b19]">{submission.reference_code}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh bg-[#f7f6f3] px-4 py-6 outline-none sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <a href="#guest-form" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#0f6b5f] shadow">Lewati ke form</a>
        <header className="mb-6 border-b border-black/10 pb-5 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f6b5f]">Form submission publik</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-[#1c1b19] sm:text-4xl">{project.name}</h1>
          {project.description ? <p className="mt-3 max-w-2xl text-base leading-7 text-[#6b6760]">{project.description}</p> : null}
        </header>

        <StepIndicator current={step} otpRequired={project.otp_required} />

        <section id="guest-form" aria-labelledby="guest-form-title" className="mt-5 rounded-3xl border border-black/10 bg-white p-5 shadow-[0_12px_32px_rgba(28,27,25,0.08)] sm:mt-7 sm:p-7">
          <div className="mb-6">
            <p className="text-sm font-semibold text-[#0f6b5f]">{step === "identity" ? "Langkah 1 dari 4" : step === "verify" ? "Langkah 2 dari 4" : step === "form" ? "Langkah 3 dari 4" : "Langkah 4 dari 4"}</p>
            <h2 id="guest-form-title" className="mt-1 text-xl font-semibold text-[#1c1b19]">{step === "identity" ? "Ceritakan tentang diri Anda" : step === "verify" ? "Verifikasi email" : step === "form" ? "Tentukan lokasi dan isi data" : "Periksa sebelum mengirim"}</h2>
          </div>

          {error ? (
            <div ref={errorSummaryRef} tabIndex={-1} role="alert" className="mb-5 flex gap-3 rounded-2xl border border-[#c0392b]/25 bg-[#fff6f5] p-4 text-sm leading-6 text-[#8f2d23] outline-none">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div><p className="font-semibold">Perlu diperbaiki</p><p>{error}</p></div>
            </div>
          ) : null}

          {step === "identity" ? (
            <form className="max-w-2xl space-y-5" onSubmit={(event) => { event.preventDefault(); void handleIdentity(); }}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nama lengkap" error={fieldErrors.full_name} required>
                  <input className={inputClass} aria-label="Nama lengkap" autoComplete="name" value={identity.full_name} onChange={(event) => updateIdentity("full_name", event.target.value)} aria-invalid={Boolean(fieldErrors.full_name)} />
                </Field>
                <Field label="Email" error={fieldErrors.email} required>
                  <input className={inputClass} aria-label="Email" type="email" autoComplete="email" value={identity.email} onChange={(event) => updateIdentity("email", event.target.value)} aria-invalid={Boolean(fieldErrors.email)} />
                </Field>
                <Field label="Telepon / WhatsApp" error={fieldErrors.phone} required>
                  <input className={inputClass} aria-label="Telepon atau WhatsApp" type="tel" autoComplete="tel" value={identity.phone} onChange={(event) => updateIdentity("phone", event.target.value)} aria-invalid={Boolean(fieldErrors.phone)} />
                </Field>
                <Field label="Instansi / organisasi" error={fieldErrors.organization} required>
                  <input className={inputClass} aria-label="Instansi atau organisasi" autoComplete="organization" value={identity.organization} onChange={(event) => updateIdentity("organization", event.target.value)} aria-invalid={Boolean(fieldErrors.organization)} />
                </Field>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#f7f6f3] p-4 text-sm leading-6 text-[#4f4b45]">
                <input type="checkbox" className="mt-1 size-4 accent-[#0f6b5f]" checked={identity.consent} onChange={(event) => updateIdentity("consent", event.target.checked)} aria-invalid={Boolean(fieldErrors.consent)} />
                <span>{project.guest_consent_text ?? "Saya menyetujui penggunaan data yang saya masukkan untuk keperluan project ini."} {project.guest_privacy_policy_url ? <a className="font-semibold text-[#0f6b5f] underline underline-offset-4" href={project.guest_privacy_policy_url} target="_blank" rel="noreferrer">Baca kebijakan privasi</a> : null}</span>
              </label>
              {fieldErrors.consent ? <p className="text-sm text-[#8f2d23]">{fieldErrors.consent}</p> : null}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs leading-5 text-[#6b6760]">Satu email hanya dapat mengirim satu data untuk project ini.</p>
                <Button type="submit" variant="primary" disabled={busy} className="min-h-11 gap-2 px-5"><LoadingIcon busy={busy} />Lanjutkan</Button>
              </div>
            </form>
          ) : null}

          {step === "verify" ? (
            <form className="max-w-md space-y-5" onSubmit={(event) => { event.preventDefault(); void handleVerify(); }}>
              <div className="rounded-2xl bg-[#e7f1ef] p-4 text-sm leading-6 text-[#0a5049]">Kode OTP telah dikirim ke <strong>{identity.email}</strong>. Masukkan kode tersebut untuk melanjutkan.</div>
              <Field label="Kode OTP" error={fieldErrors.otp} required>
                <input className={`${inputClass} font-mono tracking-[0.28em]`} aria-label="Kode OTP" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ""))} aria-invalid={Boolean(fieldErrors.otp)} />
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="ghost" onClick={() => setStep("identity")} disabled={busy} className="min-h-11 gap-2"><ChevronLeft className="size-4" aria-hidden="true" />Kembali</Button>
                <Button type="submit" variant="primary" disabled={busy} className="min-h-11 gap-2"><LoadingIcon busy={busy} />Verifikasi</Button>
                <Button type="button" variant="default" onClick={() => void resendOtp()} disabled={busy} className="min-h-11 gap-2"><RefreshCcw className="size-4" aria-hidden="true" />Kirim ulang</Button>
              </div>
            </form>
          ) : null}

          {step === "form" ? (
            <div className="space-y-6">
              {!project.otp_required ? <p className="flex items-center gap-2 rounded-xl bg-[#f2f1ee] px-3 py-2 text-sm text-[#5a5650]"><MailCheck className="size-4 text-[#0f6b5f]" aria-hidden="true" />Verifikasi email sementara dilewati pada environment ini.</p> : null}
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
                <div className="space-y-3">
                  <GuestDrawMap geometryType={project.geometry_type} drawing={drawing} draftGeometry={drawing ? draftGeometry : completedGeometry ?? draftGeometry} onCoordinate={onCoordinate} />
                  {fieldErrors.geometry ? <p className="text-sm text-[#8f2d23]">{fieldErrors.geometry}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="primary" onClick={() => { setCoordinates([]); setDrawing(true); setError(null); }} className="min-h-11 gap-2"><MapPin className="size-4" aria-hidden="true" />{coordinates.length ? "Gambar ulang" : `Tambah ${project.geometry_type}`}</Button>
                    {project.geometry_type !== "point" ? <Button type="button" variant="default" onClick={() => { if (completedGeometry) setDrawing(false); else showError(`Tambahkan cukup titik untuk ${project.geometry_type}.`, { geometry: `Geometry ${project.geometry_type} belum lengkap.` }); }} className="min-h-11">Selesai bentuk</Button> : null}
                    {coordinates.length ? <Button type="button" variant="ghost" onClick={() => { setCoordinates([]); setDrawing(false); }} className="min-h-11 gap-2"><X className="size-4" aria-hidden="true" />Hapus</Button> : null}
                  </div>
                  <p className="text-sm text-[#6b6760]">{completedGeometry ? `Siap: ${geometryLabel(completedGeometry)}.` : project.geometry_type === "polygon" ? "Polygon membutuhkan minimal tiga titik." : project.geometry_type === "line" ? "Line membutuhkan minimal dua titik." : "Pilih satu titik pada peta."}</p>
                </div>

                <div className="space-y-5 rounded-2xl border border-black/10 bg-[#fbfbfa] p-4 sm:p-5">
                  {project.form_schema.length ? project.form_schema.map((field) => (
                    <Field key={field.name} label={field.label} error={fieldErrors[field.name]} required={field.required}>
                      {field.type === "textarea" ? <textarea className={inputClass} aria-label={field.label} rows={4} value={attributes[field.name] ?? ""} onChange={(event) => setAttributes((current) => ({ ...current, [field.name]: event.target.value }))} aria-invalid={Boolean(fieldErrors[field.name])} /> : null}
                      {field.type === "select" ? <select className={inputClass} aria-label={field.label} value={attributes[field.name] ?? ""} onChange={(event) => setAttributes((current) => ({ ...current, [field.name]: event.target.value }))} aria-invalid={Boolean(fieldErrors[field.name])}><option value="">Pilih {field.label}</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : null}
                      {field.type === "number" ? <input className={inputClass} aria-label={field.label} type="number" inputMode="decimal" min={field.min} max={field.max} value={attributes[field.name] ?? ""} onChange={(event) => setAttributes((current) => ({ ...current, [field.name]: event.target.value }))} aria-invalid={Boolean(fieldErrors[field.name])} /> : null}
                      {field.type === "text" ? <input className={inputClass} aria-label={field.label} value={attributes[field.name] ?? ""} onChange={(event) => setAttributes((current) => ({ ...current, [field.name]: event.target.value }))} aria-invalid={Boolean(fieldErrors[field.name])} /> : null}
                    </Field>
                  )) : <p className="text-sm leading-6 text-[#6b6760]">Project ini tidak memiliki pertanyaan tambahan. Tambahkan lokasi untuk melanjutkan.</p>}
                </div>
              </div>
              <div className="flex flex-wrap justify-between gap-3 border-t border-black/10 pt-5">
                <Button type="button" variant="ghost" onClick={() => setStep(project.otp_required ? "verify" : "identity")} className="min-h-11 gap-2"><ChevronLeft className="size-4" aria-hidden="true" />Kembali</Button>
                <Button type="button" variant="primary" onClick={continueToReview} className="min-h-11 gap-2">Periksa data<Send className="size-4" aria-hidden="true" /></Button>
              </div>
            </div>
          ) : null}

          {step === "review" ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewGroup title="Data diri" rows={[["Nama", identity.full_name], ["Email", identity.email], ["Telepon", identity.phone], ["Instansi", identity.organization]]} />
                <ReviewGroup title="Lokasi" rows={[["Geometry", geometryLabel(completedGeometry)]]} />
              </div>
              {project.form_schema.length ? <ReviewGroup title="Data project" rows={project.form_schema.map((field) => [field.label, attributes[field.name] || "—"])} /> : null}
              <div className="rounded-2xl border border-[#0f6b5f]/20 bg-[#e7f1ef] p-4 text-sm leading-6 text-[#0a5049]">Setelah dikirim, data ini tidak dapat diubah dari halaman guest. Pastikan semua informasi sudah benar.</div>
              <div className="flex flex-wrap justify-between gap-3 border-t border-black/10 pt-5">
                <Button type="button" variant="ghost" onClick={() => setStep("form")} disabled={busy} className="min-h-11 gap-2"><ChevronLeft className="size-4" aria-hidden="true" />Edit data</Button>
                <Button type="button" variant="primary" onClick={() => void submit()} disabled={busy} className="min-h-11 gap-2 px-5"><LoadingIcon busy={busy} />Kirim sekali</Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: ReactNode }) {
  return <div><label className="text-sm font-semibold text-[#1c1b19]">{label}{required ? <span className="text-[#c0392b]"> *</span> : null}</label>{children}{error ? <p className="mt-1.5 text-sm text-[#8f2d23]">{error}</p> : null}</div>;
}

function LoadingIcon({ busy }: { busy: boolean }) {
  return busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null;
}

function ReviewGroup({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return <section className="rounded-2xl border border-black/10 bg-[#fbfbfa] p-4"><h3 className="text-sm font-semibold text-[#1c1b19]">{title}</h3><dl className="mt-3 space-y-2 text-sm">{rows.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4"><dt className="text-[#6b6760]">{label}</dt><dd className="max-w-[60%] text-right font-medium text-[#1c1b19]">{value}</dd></div>)}</dl></section>;
}
