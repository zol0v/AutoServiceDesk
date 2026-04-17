import { apiClient } from './client';

export interface UserResponse {
  id: string;
  displayName: string;
  email: string;
  role: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export function getUsers() {
  return apiClient.get<UserResponse[]>('/api/users');
}

export function updateUserRole(id: string, payload: UpdateUserRoleRequest) {
  return apiClient.put<UserResponse>(`/api/users/${id}/role`, payload);
}