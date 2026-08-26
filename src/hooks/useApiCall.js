import { useCallback } from "react";
import { serverBaseURL } from "../utils/siteconfig";

const useApiCall = () => {
  const BASE_URL = `${serverBaseURL}/api/`;

  const token = localStorage.getItem("auth");

  const apiCall = useCallback(async (endpoint, method = 'GET', data = null, requiresAuth = false) => {
    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };

    if (token && requiresAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const url = `${BASE_URL}${endpoint}`
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `Error: ${response.statusText}`);
      }

      const text = await response.text();
      if (!text) {
        return null;
      }

      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return null;
      }
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }, [token, BASE_URL]);

  return apiCall;
};

export default useApiCall;
