import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";

const authContext = createContext();

export const useAuth = () => useContext(authContext);

export const AuthProvider = ({ children }) => {
  const auth = useProvideAuth();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
};

const useProvideAuth = () => {
  const [jwtClaims, setJwtClaims] = useState(null);
  const isRefreshing = useRef(null);
  const refreshTimeOut = useRef(null);

  useEffect(() => {
    if (!jwtClaims) {
      getRefreshedToken();
    }
  }, []);
  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === "logout") {
        setJwtClaims(null);
      }
    };
    window.addEventListener("storage", syncLogout);
    return () => {
      window.removeEventListener("storage", syncLogout);
      window.localStorage.removeItem("logout");
    };
  }, []);

  const silentRefresh = (delay) => {
    if (refreshTimeOut.current) clearTimeout(refreshTimeOut.current);
    refreshTimeOut.current = window.setTimeout(
      getRefreshedToken,
      delay * 60000 - 10000
    );
  };

  const clearSilentRefresh = () => {
    if (refreshTimeOut.current) clearTimeout(refreshTimeOut.current);
  };

  const waitForTokenRefresh = () => {
    if (!isRefreshing.current) {
      return Promise.resolve();
    }
    return isRefreshing.current.then(() => {
      isRefreshing.current = null;
      return true;
    });
  };

  const getRefreshedToken = () => {
    isRefreshing.current = axios
      .post("/auth/refresh-token", null, { withCredentials: true })
      .then((response) => {
        if (response.status !== 200) {
          clearToken();
          return { jwt_token: null };
        }
        return response.data;
      })
      .then((payload) => {
        if (payload?.jwt_token) {
          setToken(payload);
          return true;
        }
        clearToken();
        return false;
      });

    return isRefreshing.current;
  };

  const setToken = (payload) => {
    setJwtClaims(payload);
    silentRefresh(3);
    return true;
  };

  const clearToken = () => {
    setJwtClaims(null);
    clearSilentRefresh();
    window.localStorage.setItem("logout", Date.now());
    return true;
  };

  const login = ({ username, password }) => {
    return axios
      .post("/auth/login", { username, password })
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(response.statusText);
        }
        return response.data;
      })
      .then((payload) => {
        return setToken(payload);
      });
  };
  const logout = () => {
    clearToken();
    return axios
      .post("/auth/logout", null, { withCredentials: true })
      .then(() => "/login");
  };

  return {
    jwtClaims,
    login,
    logout,
  };
};
