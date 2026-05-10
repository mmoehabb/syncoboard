import { ApiClient } from "./ApiClient";
import { Plan } from "@syncoboard/db";

export interface AdminLoginRequest {
  username: string;
  password?: string;
}

export interface AdminLoginResponse {
  accessToken: string;
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: Date;
  workspaceCount: number;
  boardCount: number;
}

export interface AdminPlanCreateRequest {
  name: string;
  maxWorkspaces?: number;
  maxBoardsPerWorkspace?: number;
  maxMembersPerBoard?: number;
  maxActiveBoards?: number;
  isTrial?: boolean;
  isActive?: boolean;
}

export interface AdminPlanUpdateRequest extends Partial<AdminPlanCreateRequest> {}

export interface AdminChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}

export interface AdminChangePasswordResponse {
  success: boolean;
}

export class AdminApi extends ApiClient {
  constructor(baseURL = "/api/admin") {
    super(baseURL);
  }

  public async login(data: AdminLoginRequest): Promise<AdminLoginResponse> {
    const response = await this.post<AdminLoginResponse>("/auth", data);
    return response.data;
  }

  public async getUsers(): Promise<AdminUser[]> {
    const response = await this.get<AdminUser[]>("/users");
    return response.data;
  }

  public async getPlans(): Promise<Plan[]> {
    const response = await this.get<Plan[]>("/plans");
    return response.data;
  }

  public async createPlan(data: AdminPlanCreateRequest): Promise<Plan> {
    const response = await this.post<Plan>("/plans", data);
    return response.data;
  }

  public async updatePlan(
    id: string,
    data: AdminPlanUpdateRequest,
  ): Promise<Plan> {
    const response = await this.put<Plan>(`/plans/${id}`, data);
    return response.data;
  }

  public async changePassword(
    data: AdminChangePasswordRequest,
  ): Promise<AdminChangePasswordResponse> {
    const response = await this.post<AdminChangePasswordResponse>(
      "/auth/password",
      data,
    );
    return response.data;
  }
}
