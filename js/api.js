/**
 * Revival — API Client Layer
 * Centralized interface between frontend modules and the backend.
 * All modules call API.* methods instead of localStorage directly.
 */
const API = (() => {
    const BASE = '/api';
    const TOKEN_KEY = 'revival_token';

    function getToken() { return localStorage.getItem(TOKEN_KEY); }
    function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
    function clearToken() { localStorage.removeItem(TOKEN_KEY); }
    function isAuthenticated() { return !!getToken(); }

    /** Decode JWT payload without a library */
    function decodeToken() {
        const t = getToken();
        if (!t) return null;
        try { return JSON.parse(atob(t.split('.')[1])); }
        catch { return null; }
    }

    /** Core fetch wrapper */
    async function request(endpoint, options = {}) {
        const token = getToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const res = await fetch(BASE + endpoint, { headers, ...options });

            if (res.status === 401) {
                clearToken();
                // Don't redirect if already on login page
                if (!window.location.pathname.includes('login')) {
                    window.location.href = '/login.html';
                }
                return { error: 'Session expired' };
            }

            const data = await res.json();
            if (!res.ok) return { error: data.error || 'Request failed' };
            return data;
        } catch (err) {
            console.error('API error:', err);
            return { error: 'Network error — is the server running?' };
        }
    }

    return {
        // Token management
        getToken, setToken, clearToken, isAuthenticated, decodeToken,

        // HTTP methods
        get: (url) => request(url),
        post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
        put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
        patch: (url, body) => request(url, { method: 'PATCH', body: JSON.stringify(body) }),
        delete: (url) => request(url, { method: 'DELETE' }),
    };
})();
