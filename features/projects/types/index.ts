export type GeometryType = "point" | "line" | "polygon";

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "date"
  | "checkbox"
  | "file";

export interface ProjectFormField {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  min?: number;
  max?: number;
  options?: string[];
  extensions?: string[];
}

/** Mutable editor shape: every optional key is present so the form can round-trip a stored schema. */
export interface DraftFormField {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  min: string;
  max: string;
  options: string;
  extensions: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  geometry_type: GeometryType;
  form_schema: ProjectFormField[];
  layer_id: string | null;
  is_published: boolean;
  public_slug: string | null;
  guest_enabled: boolean;
  guest_starts_at: string | null;
  guest_ends_at: string | null;
  guest_consent_required: boolean;
  guest_consent_text: string | null;
  guest_privacy_policy_url: string | null;
  feature_count: number;
  created_at: string;
  updated_at: string;
}

export type Position = [number, number];

export type FeatureGeometry =
  | { type: "Point"; coordinates: Position }
  | { type: "LineString"; coordinates: Position[] }
  | { type: "Polygon"; coordinates: Position[][] };

export interface ProjectFeature {
  id: string;
  project_id: string;
  geometry: FeatureGeometry;
  attributes: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFeatureInput {
  geometry: FeatureGeometry;
  attributes: Record<string, string | number | null>;
}

export interface FeatureTopologyResult {
  operation_id: string;
  operation: "cut" | "merge";
  features: ProjectFeature[];
  replayed: boolean;
}

export interface ProjectCreateInput {
  name: string;
  description: string | null;
  geometry_type: GeometryType;
  form_schema: ProjectFormField[];
  public_slug: string | null;
  guest_enabled: boolean;
  guest_starts_at: string | null;
  guest_ends_at: string | null;
  guest_consent_required: boolean;
  guest_consent_text: string | null;
  guest_privacy_policy_url: string | null;
}

/**
 * Every key is always sent. Tileserver reads `model_fields_set` for the nullable guest
 * fields, so an omitted key means "leave unchanged" while an explicit `null` clears.
 */
export interface ProjectUpdateInput {
  name: string;
  description: string;
  public_slug: string | null;
  guest_enabled: boolean;
  guest_starts_at: string | null;
  guest_ends_at: string | null;
  guest_consent_required: boolean;
  guest_consent_text: string | null;
  guest_privacy_policy_url: string | null;
}

export interface ProjectGeofence {
  project_id: string;
  geometry: FeatureGeometry;
  bbox: number[];
  created_at: string;
  updated_at: string;
}

export type GuestAvailability = "disabled" | "scheduled" | "open" | "ended";
