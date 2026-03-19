const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions<T = any> {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: T;
}
interface RequestReturn<R = any> {
    status: number | undefined;
    data?: R;

}
async function request<R, T = any>(endpoint: string, options: RequestOptions<T> = {}): Promise<RequestReturn<R>> {
    const { method = 'GET', headers = {}, body } = options;

    const token = localStorage.getItem("token");
    const authHeaders: Record<string, string> = {};
    if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...headers,
        },
    };

    if (body) {
        config.body = JSON.stringify(body);
    }
    let jsonData = undefined;
    let responseStatus = undefined
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
        responseStatus = response.status;
        jsonData = await response.json();
    } catch (err) {

    };
    return {
        status: responseStatus,
        data: jsonData
    }
};
export const apiHelper = {
    get: <R>(endpoint: string, headers?: Record<string, string>) =>
        request<R>(endpoint, { method: 'GET', headers }),

    post: <T, R>(endpoint: string, body: T, headers?: Record<string, string>) =>
        request<R, T>(endpoint, { method: 'POST', body, headers }),

    put: <T, R>(endpoint: string, body: T, headers?: Record<string, string>) =>
        request<R, T>(endpoint, { method: 'PUT', body, headers }),

    patch: <T, R>(endpoint: string, body: T, headers?: Record<string, string>) =>
        request<R, T>(endpoint, { method: 'PATCH', body, headers }),

    delete: <R>(endpoint: string, headers?: Record<string, string>) =>
        request<R>(endpoint, { method: 'DELETE', headers }),
};
