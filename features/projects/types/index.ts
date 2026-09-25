export type GeometryType = "point" | "line" | "polygon";

export type FormFieldType = "text" | "textarea" | "number" | "select" | "file";

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

export interface Project {
  id: string;
  name: string;
  description: string | null;
  geometry_type: GeometryType;
  form_schema: ProjectFormField[];
  layer_id: string | null;
  is_published: boolean;
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
