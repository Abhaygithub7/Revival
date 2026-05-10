/**
 * Revival — Customer Auth Module
 * Registration, login, logout, session. Separate from admin auth.
 * Keys: revival_customer_users (all registered users), revival_customer_session (current)
 */
const CustomerAuth = (() => {
    const USERS_KEY = 'revival_customer_users';
    const SESSION_KEY = 'revival_customer_session';

    function getUsers() {
        try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
        catch { return []; }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    /** Returns current user object or null */
    function getUser() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
        catch { return null; }
    }

    function isLoggedIn() {
        return !!getUser();
    }

    /** Register a new customer */
    function register(name, email, password) {
        const users = getUsers();
        if (users.find(u => u.email === email)) {
            return { success: false, error: 'An account with this email already exists.' };
        }
        const user = {
            id: Date.now(),
            name,
            email,
            password, // demo only — plain text
            createdAt: new Date().toISOString(),
            addresses: [],
        };
        users.push(user);
        saveUsers(users);
        login(email, password);
        return { success: true, user: { id: user.id, name: user.name, email: user.email } };
    }

    /** Login */
    function login(email, password) {
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            return { success: false, error: 'Invalid email or password.' };
        }
        const session = { id: user.id, name: user.name, email: user.email, loggedInAt: new Date().toISOString() };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return { success: true, user: session };
    }

    /** Logout */
    function logout() {
        localStorage.removeItem(SESSION_KEY);
    }

    /** Add an address for current user */
    function addAddress(address) {
        const user = getUser();
        if (!user) return;
        const users = getUsers();
        const u = users.find(x => x.id === user.id);
        if (u) {
            u.addresses.push(address);
            saveUsers(users);
        }
    }

    /** Get saved addresses for current user */
    function getAddresses() {
        const user = getUser();
        if (!user) return [];
        const users = getUsers();
        const u = users.find(x => x.id === user.id);
        return u ? u.addresses : [];
    }

    return { getUser, isLoggedIn, register, login, logout, addAddress, getAddresses };
})();