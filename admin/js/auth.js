/**
 * Revival Admin — Auth Module
 * Redirects to unified login portal if not authenticated
 */
const Auth = (() => {
    const KEY = 'revival_admin_session';
    function check() {
        const session = localStorage.getItem(KEY);
        if (!session) { window.location.href = '../login.html'; return null; }
        return JSON.parse(session);
    }
    function logout() { localStorage.removeItem(KEY); window.location.href = '../login.html'; }
    function getUser() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
    return { check, logout, getUser };
})();
