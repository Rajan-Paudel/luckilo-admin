import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slice/authSlice';
import dataReducer from './slice/dataSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    data: dataReducer,
  },
});

export default store;
