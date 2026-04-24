import { apiClient } from './client';

export type TicketStatus = 'New' | 'InProgress' | 'Resolved' | 'Closed' | 'Rejected';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export interface UserBriefResponse {
  id: string;
  displayName: string;
  email: string;
}

export interface TicketResponse {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  categoryId: number;
  categoryName: string;
  author: UserBriefResponse;
  assignee: UserBriefResponse | null;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  categoryId: number;
  priority: TicketPriority;
}

export interface TicketsQuery {
  status?: TicketStatus;
  categoryId?: number;
  assignedToMe?: boolean;
  unassignedOnly?: boolean;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
}

function buildTicketsQuery(params?: TicketsQuery) {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();

  if (params.status) {
    searchParams.set('status', params.status);
  }

  if (typeof params.categoryId === 'number') {
    searchParams.set('categoryId', params.categoryId.toString());
  }

  if (params.assignedToMe === true) {
    searchParams.set('assignedToMe', 'true');
  }

  if (params.unassignedOnly === true) {
    searchParams.set('unassignedOnly', 'true');
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function getTickets(params?: TicketsQuery) {
  return apiClient.get<PagedResponse<TicketResponse>>(`/api/tickets${buildTicketsQuery(params)}`);
}

export function getTicketById(id: number) {
  return apiClient.get<TicketResponse>(`/api/tickets/${id}`);
}

export function createTicket(payload: CreateTicketRequest) {
  return apiClient.post<TicketResponse>('/api/tickets', payload);
}

export function assignTicket(id: number) {
  return apiClient.post<TicketResponse>(`/api/tickets/${id}/assign`);
}

export function changeTicketStatus(id: number, status: TicketStatus) {
  return apiClient.post<TicketResponse>(`/api/tickets/${id}/status`, { status });
}

export function rejectTicket(id: number, reason: string) {
  return apiClient.post<TicketResponse>(`/api/tickets/${id}/reject`, { reason });
}