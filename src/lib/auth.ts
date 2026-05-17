const TOKEN_KEY = "lexsee_admin_token";

export type Profile = {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
};

export const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(TOKEN_KEY) || "";
};

export const setToken = (token: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
};

export const getProfile = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const token = getToken();
    const res = await fetch(`${baseUrl}/profile`, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
        throw new Error("Failed to load profile");
    }
    return (await res.json()) as Profile;
};
