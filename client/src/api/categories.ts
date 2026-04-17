import { apiClient } from './client';

export interface CategoryResponse {
  id: number;
  name: string;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

export interface SetActiveCategoryRequest {
  isActive: boolean;
}

export function getCategories(includeInactive = false) {
  const query = includeInactive ? '?includeInactive=true' : '';
  return apiClient.get<CategoryResponse[]>(`/api/categories${query}`);
}

export function createCategory(payload: CreateCategoryRequest) {
  return apiClient.post<CategoryResponse>('/api/categories', payload);
}

export function updateCategory(id: number, payload: UpdateCategoryRequest) {
  return apiClient.put<CategoryResponse>(`/api/categories/${id}`, payload);
}

export function setCategoryActive(id: number, payload: SetActiveCategoryRequest) {
  return apiClient.patch<CategoryResponse>(`/api/categories/${id}/active`, payload);
}