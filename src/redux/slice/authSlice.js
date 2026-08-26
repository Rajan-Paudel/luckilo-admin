import { createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

const initialState = {
  auth: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.auth = jwtDecode(action.payload);
      localStorage.setItem("auth", action.payload);
    },

    clearAuth: (state) => {
      state.auth = null;
      localStorage.removeItem("auth");
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
