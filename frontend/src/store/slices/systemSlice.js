import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import { ENDPOINTS } from '../../api/endpoints';

export const getSettings = createAsyncThunk(
  'system/getSettings',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.SYSTEM.SETTINGS.GET_ALL, { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateSetting = createAsyncThunk(
  'system/updateSetting',
  async ({ key, value, branchId }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.SYSTEM.SETTINGS.UPDATE(key), { value, branchId });
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const getCategories = createAsyncThunk(
  'system/getCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.SYSTEM.CATEGORIES.GET_ALL);
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateCategory = createAsyncThunk(
  'system/updateCategory',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.SYSTEM.CATEGORIES.UPDATE(id), data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'system/deleteCategory',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(ENDPOINTS.SYSTEM.CATEGORIES.DELETE(id));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createCategory = createAsyncThunk(
  'system/createCategory',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.SYSTEM.CATEGORIES.CREATE, data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const systemSlice = createSlice({
  name: 'system',
  initialState: {
    settings: [],
    categories: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.categories = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(updateSetting.fulfilled, (state, action) => {
        const index = state.settings.findIndex(s => s.key === action.payload.key);
        if (index !== -1) {
          state.settings[index] = action.payload;
        } else {
          state.settings.push(action.payload);
        }
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(c => c._id !== action.payload);
      });
  },
});

export default systemSlice.reducer;


