/**
 * Revival Admin — Auth Module
 */
const Auth = (() => {
    const KEY = 'revival_admin_session';
    function check() {
        const session = localStorage.getItem(KEY);
        if (!session) { window.location.href = '../admin.html'; return null; }
        return JSON.parse(session);
    }
    function logout() { localStorage.removeItem(KEY); window.location.href = '../admin.html'; }
    function getUser() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
    return { check, logout, getUser };
})();
