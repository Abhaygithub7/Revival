/**
 * Revival — Customer Auth Module
 * Registration, login, logout, session via API.
 */
const CustomerAuth = (() => {
    async function getUser() {
        if (!API.isAuthenticated()) return null;
        const res = await API.get('/auth/me');
        if (res.error) {
            API.clearToken();
            return null;
        }
        return res.user;
    }

    function isLoggedIn() {
        return API.isAuthenticated();
    }

    async function register(name, email, password) {
        const res = await API.post('/auth/register', { name, email, password });
        if (res.error) {
            return { success: false, error: res.error };
        }
        API.setToken(res.token);
        return { success: true, user: res.user };
    }

    async function login(email, password) {
        const res = await API.post('/auth/login', { email, password });
        if (res.error) {
            return { success: false, error: res.error };
        }
        API.setToken(res.token);
        return { success: true, user: res.user };
    }

    function logout() {
        API.clearToken();
    }

    async function addAddress(address) {
        const res = await API.put('/auth/address', address);
        return res.addresses;
    }

    async function getAddresses() {
        const user = await getUser();
        return user ? user.addresses : [];
    }

    return { getUser, isLoggedIn, register, login, logout, addAddress, getAddresses };
})();