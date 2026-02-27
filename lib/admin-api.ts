import { Exhibition, fetchExhibitions, fetchExhibitionById } from './data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const getAdminToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('admin_token');
    }
    return null;
};

export const setAdminToken = (token: str) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('admin_token', token);
    }
};

export const removeAdminToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
    }
};

export const adminFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAdminToken();
    const headers = new Headers(options.headers || {});

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        removeAdminToken();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
            window.location.href = '/admin/login';
        }
        throw new Error('Unauthorized');
    }

    return response;
};

export const adminLogin = async (username: str, password: str) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        throw new Error('Login failed');
    }

    const data = await res.json();
    setAdminToken(data.access_token);
    return data;
};

export const createExhibition = async (data: any) => {
    const res = await adminFetch('/api/exhibitions', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create exhibition');
    return res.json();
};

export const updateExhibition = async (id: number | str, data: any) => {
    const res = await adminFetch(`/api/exhibitions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update exhibition');
    return res.json();
};

export const deleteExhibition = async (id: number | str) => {
    const res = await adminFetch(`/api/exhibitions/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete exhibition');
    return true;
};
