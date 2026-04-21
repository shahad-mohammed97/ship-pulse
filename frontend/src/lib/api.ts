import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = (data: any) => api.post('/auth/login', data);
export const register = (data: any) => api.post('/auth/register', data);
export const getProfile = () => api.get('/auth/profile');
export const updateProfile = (data: any) => api.patch('/auth/profile', data);

export const getOrders = (search?: string) => api.get('/orders', { 
    params: { 
        search 
    } 
});
export const createOrder = (data: any) => api.post('/orders', data);
export const getStats = () => api.get('/orders/stats', { params: { t: Date.now() } });
export const uploadCsv = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/orders/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// Rules API
export const getRules = () => api.get('/rules');
export const createRule = (data: any) => api.post('/rules', data);
export const updateRule = (id: string, data: any) => api.put(`/rules/${id}`, data);
export const deleteRule = (id: string) => api.delete(`/rules/${id}`);

// Sync Tracking
export const updateOrder = (id: string, data: any) => api.patch(`/orders/${id}`, data);
export const deleteOrder = (id: string) => api.delete(`/orders/${id}`);
export const syncTracking = (id: string) => api.post(`/orders/${id}/sync`);
export const notifyOrder = (id: string, message: string) => api.post(`/orders/${id}/notify`, { message });

export default api;
