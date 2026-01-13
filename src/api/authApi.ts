import { apiClient } from './client';

export interface RegisterData {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: 'user' | 'volunteer';
    latitude?: number;
    longitude?: number;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        full_name: string;
        phone: string | null;
        role: 'user' | 'volunteer';
        is_verified: number;
        latitude: number | null;
        longitude: number | null;
        created_at: number;
        updated_at: number;
    };
    token: string;
}

export const authApi = {
    register: (data: RegisterData) =>
        apiClient.post<AuthResponse>('/auth/register', data),

    login: (data: LoginData) =>
        apiClient.post<AuthResponse>('/auth/login', data),

    getCurrentUser: () =>
        apiClient.get<AuthResponse['user']>('/auth/me'),

    updateProfile: (data: { full_name?: string; phone?: string }) =>
        apiClient.put<AuthResponse['user']>('/auth/profile', data),

    updateLocation: (latitude: number, longitude: number) =>
        apiClient.put('/auth/location', { latitude, longitude }),

    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    },

    saveAuthData: (token: string, user: AuthResponse['user']) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
    },

    getStoredUser: (): AuthResponse['user'] | null => {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('auth_token');
    }
};
