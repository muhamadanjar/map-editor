import type { FeatureGeometry, GeometryType, ProjectFormField } from "@/features/projects/types";

export interface GuestProject {
  public_slug: string;
  name: string;
  description: string | null;
  geometry_type: GeometryType;
  form_schema: ProjectFormField[];
  guest_consent_required: boolean;
  guest_consent_text: string | null;
  guest_privacy_policy_url: string | null;
  otp_required: boolean;
}

export interface GuestIdentity {
  full_name: string;
  email: string;
  phone: string;
  organization: string;
  consent: boolean;
}

export interface GuestSession {
  session_token: string;
  expires_at: string;
  otp_required: boolean;
}

export interface GuestSubmission {
  submission_id: string;
  feature_id: string;
  reference_code: string;
  submitted_at: string;
  status: string;
}

export interface GuestSubmissionInput {
  geometry: FeatureGeometry;
  attributes: Record<string, string | number | null>;
  idempotency_key: string;
}
