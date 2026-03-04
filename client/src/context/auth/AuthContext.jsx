// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
// import socketIOClient from "socket.io-client";

// Utils
import { newRequest, apiUtils } from "../../utils/newRequest";
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

    // Auth + user data
    const [userInfo, setUserInfo] = useState(null);
    const [myCharacters, setMyCharacters] = useState([]);
    const [characterInfo, setCharacterInfo] = useState(null);
    // const [onlineUsers, setOnlineUsers] = useState([]);

    // Loading state
    const [loading, setLoading] = useState(true);

    // Socket
    // const [socket, setSocket] = useState(null);

    // --------------------------------------------------
    // 1) Setup socket connection on mount
    // --------------------------------------------------
    // useEffect(() => {
    //     const newSocket = socketIOClient(
    //         import.meta.env.VITE_ENV === "production"
    //             ? import.meta.env.VITE_SERVER_ORIGIN
    //             : import.meta.env.VITE_SERVER_LOCAL_ORIGIN
    //     );

    //     setSocket(newSocket);
    //     return () => newSocket.disconnect();
    // }, []);

    // useEffect(() => {
    //     if (!socket) return;
    //     socket.on("getUsers", (users) => setOnlineUsers(users));
    //     return () => socket.off("getUsers");
    // }, [socket]);

    // --------------------------------------------------
    // 2) Fetch userInfo on mount
    // --------------------------------------------------
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
        } catch {
            setUserInfo(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserMe();
    }, []);

    // // Add socket user after login load
    // useEffect(() => {
    //     if (socket && userInfo?._id) {
    //         socket.emit("addUser", userInfo._id);
    //     }
    // }, [socket, userInfo]);

    // --------------------------------------------------
    // 4) Login & Logout
    // --------------------------------------------------
    // const login = async (email, password) => {
    //     try {
    //         const res = await newRequest.post("/auth/signIn", {
    //             email,
    //             password,
    //         });

    //         const accessToken = res?.data?.metadata?.accessToken;
    //         if (accessToken) {
    //             localStorage.setItem("accessToken", accessToken);
    //             Cookies.set("accessToken", accessToken);

    //         }

    //         const user = await loadUserMe();
    //         return { success: true, user };
    //     } catch (err) {
    //         console.log("Login failed:", err);
    //         return { success: false, user: null };
    //     }
    // };

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

            console.log("SIGNIN RES:", res.data);

            if (!accessToken) {
                console.log("SignIn response (no token found):", res.data);
            } else {
                localStorage.setItem("accessToken", accessToken);
                Cookies.set("accessToken", accessToken); // optional
            }

            const user = await loadUserMe();
            return { success: true, user };
        } catch (err) {
            console.log("Login failed:", err?.response?.data || err.message);
            return { success: false, user: null };
        }
    };

    const logout = async () => {
        try {
            await apiUtils.post("/auth/logout");
        } catch (err) {
            console.error("Logout error:", err);
        }

        Cookies.remove("accessToken");
        localStorage.removeItem("accessToken");
        setUserInfo(null);
        setMyCharacters([]);
        setCharacterInfo(null);

        window.location.href = "/auth/signIn";
    };

    // --------------------------------------------------
    // 5) Context value
    // --------------------------------------------------
    const value = {
        // UI forms
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

        // Auth
        userInfo,
        login,
        logout,
        loadUserMe,
        loading,

        // Characters
        characterInfo,
        setCharacterInfo,
        myCharacters,

        // Socket
        // socket,
        // onlineUsers,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
