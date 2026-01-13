import { apiClient } from './client';
import type { HelpRequest } from '../types';


export interface CreateRequestData {
    title: string;
    description: string;
    help_type: 'medical' | 'transport' | 'shelter' | 'supplies' | 'other';
    urgency_level: 'high' | 'medium' | 'low';
    location_name: string;
    latitude: number;
    longitude: number;
    expires_in_hours?: number;
}

export const requestApi = {
    getAll: (status?: string) => {
        const query = status ? `?status=${status}` : '';
        return apiClient.get<HelpRequest[]>(`/requests${query}`);
    },

    getById: (id: string) =>
        apiClient.get<HelpRequest>(`/requests/${id}`),

    create: (data: CreateRequestData) =>
        apiClient.post<HelpRequest>('/requests', data),

    accept: (id: string) =>
        apiClient.put<HelpRequest>(`/requests/${id}/accept`),

    complete: (id: string) =>
        apiClient.put<HelpRequest>(`/requests/${id}/complete`),

    delete: (id: string) =>
        apiClient.delete<{ message: string }>(`/requests/${id}`),

    getMyRequests: () =>
        apiClient.get<HelpRequest[]>('/users/my-requests'),

    getMyResponses: () =>
        apiClient.get<HelpRequest[]>('/users/my-responses'),
};
