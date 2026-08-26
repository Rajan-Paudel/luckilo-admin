import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { serverBaseURL } from "../../utils/siteconfig";

const BASE_URL = `${serverBaseURL}/api/`;

const authHeaders = () => {
  const token = localStorage.getItem("auth");
  return {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchUsers = createAsyncThunk("data/fetchUsers", async () => {
  const res = await fetch(`${BASE_URL}admin/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
});

export const fetchMilestones = createAsyncThunk("data/fetchMilestones", async () => {
  const res = await fetch(`${BASE_URL}admin/milestones`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch milestones");
  return res.json();
});

export const fetchAdmins = createAsyncThunk("data/fetchAdmins", async () => {
  const res = await fetch(`${BASE_URL}admin/admins`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch admins");
  return res.json();
});

export const fetchGroups = createAsyncThunk("data/fetchGroups", async () => {
  const res = await fetch(`${BASE_URL}admin/groups`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch groups");
  return res.json();
});

export const fetchPayouts = createAsyncThunk("data/fetchPayouts", async () => {
  const res = await fetch(`${BASE_URL}admin/payouts`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch payouts");
  return res.json();
});

const initialState = {
  users: [],
  milestones: [],
  admins: [],
  groups: [],
  payouts: [],
  usersFetched: false,
  milestonesFetched: false,
  adminsFetched: false,
  groupsFetched: false,
  payoutsFetched: false,
  loading: false,
  error: null,
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    clearData: (state) => {
      state.users = [];
      state.milestones = [];
      state.admins = [];
      state.groups = [];
      state.payouts = [];
      state.usersFetched = false;
      state.milestonesFetched = false;
      state.adminsFetched = false;
      state.groupsFetched = false;
      state.payoutsFetched = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload || [];
        state.usersFetched = true;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchMilestones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMilestones.fulfilled, (state, action) => {
        state.loading = false;
        state.milestones = action.payload || [];
        state.milestonesFetched = true;
      })
      .addCase(fetchMilestones.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchAdmins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.loading = false;
        state.admins = action.payload || [];
        state.adminsFetched = true;
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload || [];
        state.groupsFetched = true;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchPayouts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayouts.fulfilled, (state, action) => {
        state.loading = false;
        state.payouts = action.payload || [];
        state.payoutsFetched = true;
      })
      .addCase(fetchPayouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearData } = dataSlice.actions;
export default dataSlice.reducer;
