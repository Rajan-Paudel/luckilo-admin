import { useDispatch } from "react-redux";
import { setAuth, clearAuth } from "../redux/slice/authSlice";
import useApiCall from "./useApiCall";
import { useState } from "react";

let isInitialized = false;

const useAuth = () => {
  const dispatch = useDispatch();
  const apiCall = useApiCall();

  const [hasInitialized, setHasInitialized] = useState(isInitialized);

  const initializeAuth = async (forceLoad = false) => {
    if (isInitialized && !forceLoad) return;

    const storedToken = localStorage.getItem("auth");

    if (storedToken) {
      dispatch(setAuth(storedToken));
    }

    isInitialized = true;
    setHasInitialized(true);
  };

  return {
    login: async (email, password) => {
      const data = await apiCall("admin/login", "POST", { email, password });
      dispatch(setAuth(data.token));
      return data;
    },
    logout: () => {
      dispatch(clearAuth());
      isInitialized = false;
      setHasInitialized(false);
      window.location.href = "/login";
    },
    initializeAuth,
    hasInitialized,
  };
};

export default useAuth;
