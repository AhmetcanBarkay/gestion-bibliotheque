const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const AUTH_INVALID_EVENT = 'app:auth-invalid';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions<T = unknown> {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: T;
}
interface RequestReturn<R = unknown> {
    status: number | undefined;
    data?: R;
    error?: string;
}

function getFailureReason(data: unknown): string {
    if (!data || typeof data !== 'object') return '';
    const maybeReason = (data as { reason?: unknown }).reason;
    return typeof maybeReason === 'string' ? maybeReason : '';
}

function shouldAutoLogout(status: number | undefined, data: unknown, hadToken: boolean): boolean {
    if (!hadToken) return false;
    const reason = getFailureReason(data).toLowerCase();
    const reasonIndicatesInvalidToken =
        reason.includes('token invalide') ||
        reason.includes('token invalide ou expire') ||
        reason.includes('token invalide ou expiré') ||
        reason.includes('authentification requise') ||
        reason.includes('non authentifie') ||
        reason.includes('non authentifié');

    return status === 401 || reasonIndicatesInvalidToken;
}

function dispatchAuthInvalidEvent() {
    localStorage.removeItem('token');
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_INVALID_EVENT));
    }
}

async function request<R, T = any>(endpoint: string, options: RequestOptions<T> = {}): Promise<RequestReturn<R>> {
    const { method = 'GET', headers = {}, body } = options;

    const token = localStorage.getItem("token");
    const hadToken = Boolean(token);
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

    if (body !== undefined) {
        config.body = JSON.stringify(body);
    }

    let jsonData: R | undefined = undefined;
    let responseStatus: number | undefined = undefined;
    let requestError: string | undefined = undefined;

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        responseStatus = response.status;

        const responseText = await response.text();
        if (responseText.length > 0) {
            try {
                jsonData = JSON.parse(responseText) as R;
            } catch {
                requestError = 'Réponse invalide du serveur';
            }
        }

        if (shouldAutoLogout(responseStatus, jsonData, hadToken)) {
            dispatchAuthInvalidEvent();
        }
    } catch (err: unknown) {
        requestError = err instanceof Error ? err.message : 'Erreur réseau';
    }

    return {
        status: responseStatus,
        data: jsonData,
        error: requestError
    };
}

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
