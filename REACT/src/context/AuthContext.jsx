/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import {
  loginUser,
  loginAdmin,
  registerUser,
  verifyRegistrationOtp,
  socialLogin,
  getMe,
  getAdminMe,
} from "../API/index.js";

import cookies from "../utils/cookies.js";

export const AuthContext = createContext(null);

const TOKEN_KEY = "token";
const USER_KEY = "user";

// Cookie options — used consistently for set AND remove
const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
  secure: window.location.protocol === "https:",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = cookies.get(USER_KEY);
      return raw || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const save = (token, u) => {
    if (!token || !u) {
      throw new Error("Authentication did not return a valid session");
    }
    const options = {
      ...COOKIE_OPTIONS,
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
    };
    cookies.set(TOKEN_KEY, token, options);
    cookies.set(USER_KEY, u, options);
    setUser(u);
  };

  const clear = () => {
    cookies.remove(TOKEN_KEY, { path: "/" });
    cookies.remove(USER_KEY, { path: "/" });
    setUser(null);
  };

  // Verify token on mount
  useEffect(() => {
    (async () => {
      const token = cookies.get(TOKEN_KEY);
      if (!token || !user) {
        setLoading(false);
        return;
      }
      try {
        const isAdmin = user.role === "admin" || user.role === "operator";
        const res = isAdmin ? await getAdminMe() : await getMe();
        const fresh = res.data?.data;
        save(token, { ...user, ...fresh });
      } catch {
        clear();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    const { token, ...u } = res.data?.data || {};
    save(token, u);
    return u;
  };

  const loginAsAdmin = async (email, password) => {
    const res = await loginAdmin({ email, password });
    const { token, ...u } = res.data?.data || {};
    save(token, u);
    return u;
  };

  const register = async (payload) => {
    return registerUser(payload);
  };

  const verifySignupOtp = async (email, otp, photo) => {
    const res = await verifyRegistrationOtp({ email, otp, ...(photo && { photo }) });
    const { token, ...u } = res.data?.data || {};
    save(token, u);
    return u;
  };

  const loginWithSocial = async (socialData) => {
    const res = await socialLogin(socialData);
    const { token, ...u } = res.data?.data || {};
    save(token, u);
    return u;
  };

  const completeSocialLogin = async (token) => {
    if (!token || typeof token !== "string") {
      throw new Error("Social sign-in did not return a valid session");
    }
    const response = await getMe(token);
    const userData = response.data?.data;
    if (!userData?._id) {
      throw new Error("Could not load your account after social sign-in");
    }
    save(token, userData);
    return userData;
  };

  const logout = () => clear();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginAsAdmin,
        register,
        verifySignupOtp,
        loginWithSocial,
        completeSocialLogin,
        logout,
        setUser,
        isAuth: !!user,
        isAdmin: user?.role === "admin",
        isOperator: user?.role === "operator",
        canAdmin: user?.role === "admin" || user?.role === "operator",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}