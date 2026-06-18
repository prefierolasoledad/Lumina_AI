import { Assignment, Question } from "../store/assignmentStore";
import { authService } from "./authService";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

let API_BASE_URL = '/api';

/**
 * Custom fetch wrapper that automatically handles credentials and silent token refresh on 401.
 */
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  options.credentials = "include";
  let response = await fetch(url, options);

  if (response.status === 401) {
    const refreshResult = await authService.refresh();
    if (refreshResult.success) {
      response = await fetch(url, options);
    } else {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("unauthorized"));
      }
    }
  }
  return response;
}

export const api = {
  /**
   * Generates a question paper based on the current assignment config
   */
  async generateAssignment(config: any): Promise<ApiResponse<any>> {
    try {
      const isFormData = config instanceof FormData;
      const headers: HeadersInit = {};
      
      if (!isFormData) {
        headers["Content-Type"] = "application/json";
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/assignments/generate`, {
        method: "POST",
        headers,
        body: isFormData ? config : JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("API generateAssignment error:", error);
      return {
        success: false,
        error: error.message || "Failed to generate assignment. Please try again.",
      };
    }
  },

  /**
   * Fetches an existing assignment by ID
   */
  async getAssignmentById(id: string): Promise<ApiResponse<Assignment>> {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/assignments/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error: any) {
      console.error("API getAssignmentById error:", error);
      return {
        success: false,
        error: error.message || `Failed to fetch assignment with ID: ${id}`,
      };
    }
  },

  /**
   * Uploads material files for assessment generation context
   */
  async uploadReferenceMaterial(file: File): Promise<ApiResponse<{ fileUrl: string; token: string }>> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authenticatedFetch(`${API_BASE_URL}/materials/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("API uploadReferenceMaterial error:", error);
      return {
        success: false,
        error: error.message || "Failed to upload reference material.",
      };
    }
  },

  /**
   * Fetches all assignments for the logged-in user
   */
  async listAssignments(): Promise<ApiResponse<any[]>> {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/assignments`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const resData = await response.json();
      return { success: true, data: resData.data };
    } catch (error: any) {
      console.error("API listAssignments error:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch assignments.",
      };
    }
  },

  /**
   * Deletes an assignment by ID
   */
  async deleteAssignment(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/assignments/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const resData = await response.json();
      return { success: true, data: resData };
    } catch (error: any) {
      console.error("API deleteAssignment error:", error);
      return {
        success: false,
        error: error.message || "Failed to delete assignment.",
      };
    }
  },

  /**
   * Updates an existing assignment by ID
   */
  async updateAssignment(id: string, payload: any): Promise<ApiResponse<Assignment>> {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/assignments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const resData = await response.json();
      return { success: true, data: resData.data };
    } catch (error: any) {
      console.error("API updateAssignment error:", error);
      return {
        success: false,
        error: error.message || "Failed to update assignment.",
      };
    }
  },

  /**
   * Assign an assignment to a group (or pass null to unassign)
   */
  async assignToGroup(id: string, groupId: string | null): Promise<ApiResponse<any>> {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/assignments/${id}/group`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error || "Failed to assign group." };
      return { success: true, data: data.data };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to assign group." };
    }
  },

  // ─────────────── AI Teacher's Toolkit ───────────────

  /**
   * Run an AI toolkit tool (lesson-plan, rubric, concept-explainer, quiz-from-notes)
   */
  async runToolkitTool(tool: string, inputs: Record<string, string>): Promise<ApiResponse<{ tool: string; result: string }>> {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/toolkit/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, inputs }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || "Generation failed. Please try again." };
      }
      return { success: true, data: data.data };
    } catch (error: any) {
      console.error("API runToolkitTool error:", error);
      return { success: false, error: error.message || "Failed to run AI tool." };
    }
  },

  // ─────────────── Groups ───────────────

  async listGroups(): Promise<ApiResponse<any[]>> {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/groups`);
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error || "Failed to fetch groups." };
      return { success: true, data: data.data };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to fetch groups." };
    }
  },

  async createGroup(payload: any): Promise<ApiResponse<any>> {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error || "Failed to create group." };
      return { success: true, data: data.data };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to create group." };
    }
  },

  async updateGroup(id: string, payload: any): Promise<ApiResponse<any>> {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error || "Failed to update group." };
      return { success: true, data: data.data };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to update group." };
    }
  },

  async deleteGroup(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/groups/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error || "Failed to delete group." };
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to delete group." };
    }
  },
};
