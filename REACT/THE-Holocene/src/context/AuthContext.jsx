import { createContext, useEffect, useState } from "react";
import {
  loginUser,
  loginAdmin,
  registerUser,
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
  // expires: new Date(Date.now() + 2 * 60 * 60 * 1000), // uncomment to match backend 2h JWT
  // secure: true, // enable in production (requires HTTPS)
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
    cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS);
    cookies.set(USER_KEY, u, COOKIE_OPTIONS);
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
    const res = await registerUser(payload);
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

  const logout = () => clear();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginAsAdmin,
        register,
        loginWithSocial,
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