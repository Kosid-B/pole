import "server-only";

import { cookies } from "next/headers";
import {
  AUTH_PROVIDER_COOKIE_NAME,
  SUPABASE_ACCESS_TOKEN_COOKIE_NAME,
} from "@/lib/auth";

export const SITECOST_PROJECT_ID_COOKIE_NAME = "sitecost-project-id";

export type SiteCostProjectContext = {
  id: string;
  organization_id: string | null;
  project_code: string;
  project_name: string;
  project_type: string;
  status: string;
  enabled_modules: string[];
};

export type SiteCostProjectContextPayload = {
  ok: boolean;
  auth_mode: "legacy" | "supabase";
  actor_user_id: string | null;
  selected_project_id: string | null;
  projects: SiteCostProjectContext[];
};

export type ProjectContextLoadResult =
  | {
      configured: true;
      data: SiteCostProjectContextPayload;
      selectedProject: SiteCostProjectContext | null;
      error: null;
    }
  | {
      configured: false;
      data: null;
      selectedProject: null;
      error: string;
    }
  | {
      configured: true;
      data: null;
      selectedProject: null;
      error: string;
    };

export type ProjectContextRequestOptions = {
  requestedProjectId?: string | null;
};

const DEFAULT_PROJECT_CONTEXT_API_URL =
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/sitecost-project-context-api";

function normalizeProjectContextPayload(value: unknown): SiteCostProjectContextPayload | null {
  if (!value || typeof value !== "object") return null;

  const payload = value as Partial<SiteCostProjectContextPayload>;
  if (!payload.ok || !Array.isArray(payload.projects)) return null;
  if (payload.auth_mode !== "legacy" && payload.auth_mode !== "supabase") return null;

  const projects = payload.projects.filter((project): project is SiteCostProjectContext => {
    return Boolean(
      project &&
        typeof project.id === "string" &&
        typeof project.project_code === "string" &&
        typeof project.project_name === "string" &&
        typeof project.project_type === "string" &&
        typeof project.status === "string" &&
        Array.isArray(project.enabled_modules),
    );
  });

  return {
    ok: true,
    auth_mode: payload.auth_mode,
    actor_user_id: typeof payload.actor_user_id === "string" ? payload.actor_user_id : null,
    selected_project_id:
      typeof payload.selected_project_id === "string" ? payload.selected_project_id : null,
    projects,
  };
}

export function selectCurrentProject(payload: SiteCostProjectContextPayload) {
  if (!payload.selected_project_id) return null;
  return payload.projects.find((project) => project.id === payload.selected_project_id) ?? null;
}

export function isVerifiedProjectSelection(
  result: ProjectContextLoadResult,
  requestedProjectId: string,
) {
  return Boolean(
    requestedProjectId &&
      result.configured &&
      result.data &&
      result.error === null &&
      result.data.selected_project_id === requestedProjectId &&
      result.selectedProject?.id === requestedProjectId &&
      result.data.projects.some((project) => project.id === requestedProjectId),
  );
}

export async function getSiteCostProjectContext(
  options: ProjectContextRequestOptions = {},
): Promise<ProjectContextLoadResult> {
  const apiUrl =
    process.env.SITECOST_PROJECT_CONTEXT_API_URL?.trim() || DEFAULT_PROJECT_CONTEXT_API_URL;
  const cookieStore = await cookies();
  const provider = cookieStore.get(AUTH_PROVIDER_COOKIE_NAME)?.value;
  const cookieProjectId = cookieStore
    .get(SITECOST_PROJECT_ID_COOKIE_NAME)
    ?.value?.trim();
  const requestedProjectId =
    options.requestedProjectId !== undefined
      ? options.requestedProjectId?.trim() || undefined
      : cookieProjectId;
  const headers = new Headers({ "Content-Type": "application/json" });
  const body: Record<string, string> = {};

  if (requestedProjectId) {
    body.project_id = requestedProjectId;
  }

  if (provider === "supabase") {
    const token = cookieStore.get(SUPABASE_ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
    if (!token) {
      return {
        configured: false,
        data: null,
        selectedProject: null,
        error: "Supabase session token is not available for project context.",
      };
    }

    headers.set("Authorization", `Bearer ${token}`);
  } else {
    const code = process.env.DRYING_YARD_ADMIN_ACCESS_CODE?.trim();
    if (!code) {
      return {
        configured: false,
        data: null,
        selectedProject: null,
        error: "Project context requires DRYING_YARD_ADMIN_ACCESS_CODE in legacy mode.",
      };
    }

    body.code = code;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        raw && typeof raw === "object" && "error" in raw
          ? String((raw as { error?: unknown }).error || `HTTP_${response.status}`)
          : `HTTP_${response.status}`;

      return {
        configured: true,
        data: null,
        selectedProject: null,
        error: message,
      };
    }

    const payload = normalizeProjectContextPayload(raw);
    if (!payload) {
      return {
        configured: true,
        data: null,
        selectedProject: null,
        error: "Project context returned an invalid payload.",
      };
    }

    return {
      configured: true,
      data: payload,
      selectedProject: selectCurrentProject(payload),
      error: null,
    };
  } catch (error) {
    return {
      configured: true,
      data: null,
      selectedProject: null,
      error: error instanceof Error ? error.message : "Unable to load project context.",
    };
  }
}
