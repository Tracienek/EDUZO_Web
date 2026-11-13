import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

import { newRequest } from "../../utils/newRequest";
import { formatEmailToName } from "../../utils/formatter";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // UI states
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
    const [
        showResetPasswordVerificationForm,
        setShowResetPasswordVerificationForm,
    ] = useState(false);
    const [showSetNewPasswordForm, setShowSetNewPasswordForm] = useState(false);
    const [showRegisterVerificationForm, setShowRegisterVerificationForm] =
        useState(false);
    const [overlayVisible, setOverlayVisible] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Authentication & user data
    const [userInfo, setUserInfo] = useState(null);
    const [myCharacters, setMyCharacters] = useState([]);
    const [characterInfo, setCharacterInfo] = useState(null);

    // Loading state
    const [loading, setLoading] = useState(true);

    // Load currently authenticated user
    const loadUserMe = async () => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            setUserInfo(null);
            setLoading(false);
            return null;
        }

        try {
            const res = await newRequest.get("/user/me");
            const user = res.data.metadata.user;

            user.displayName = formatEmailToName(user.email);
            setUserInfo(user);

            return user;
        } catch (err) {
            console.error("Failed to load user:", err);
            setUserInfo(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Restore login session when the app starts
    useEffect(() => {
        loadUserMe();
    }, []);

    // Login
    const login = async (email, password) => {
        try {
            const res = await newRequest.post("/auth/signIn", {
                email,
                password,
            });

            const accessToken =
                res?.data?.metadata?.accessToken ||
                res?.data?.metadata?.token ||
                res?.data?.accessToken ||
                res?.data?.token;

            // Reject login if no access token is returned
            if (!accessToken) {
                return { success: false, user: null };
            }

            localStorage.setItem("accessToken", accessToken);

            const user = await loadUserMe();

            // Reject incomplete authentication
            if (!user) {
                localStorage.removeItem("accessToken");
                return { success: false, user: null };
            }

            return { success: true, user };
        } catch (err) {
            console.error("Login failed:", err?.response?.data || err.message);

            return { success: false, user: null };
        }
    };

    // Logout
    const logout = async () => {
        // Clear old authentication cookie
        Cookies.remove("accessToken");

        // Remove locally stored JWT
        localStorage.removeItem("accessToken");

        // Clear authenticated user state
        setUserInfo(null);
        setMyCharacters([]);
        setCharacterInfo(null);

        // Redirect without waiting for an API request
        window.location.href = "/auth/signIn";
    };

    // Context values
    const value = {
        showLoginForm,
        setShowLoginForm,
        showRegisterForm,
        setShowRegisterForm,
        showResetPasswordForm,
        setShowResetPasswordForm,
        showResetPasswordVerificationForm,
        setShowResetPasswordVerificationForm,
        showSetNewPasswordForm,
        setShowSetNewPasswordForm,
        showRegisterVerificationForm,
        setShowRegisterVerificationForm,
        overlayVisible,
        setOverlayVisible,
        showMenu,
        setShowMenu,

        // Authentication
        userInfo,
        login,
        logout,
        loadUserMe,
        loading,

        // Characters
        characterInfo,
        setCharacterInfo,
        myCharacters,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
