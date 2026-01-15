import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import { ENDPOINTS } from '../../api/endpoints';

export const getCampaigns = createAsyncThunk(
  'marketing/getCampaigns',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.MARKETING.CAMPAIGNS.GET_ALL);
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createCampaign = createAsyncThunk(
  'marketing/createCampaign',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.MARKETING.CAMPAIGNS.CREATE, data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const getLoyaltyPrograms = createAsyncThunk(
  'marketing/getLoyaltyPrograms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.MARKETING.LOYALTY.GET_ALL);
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const getNotifications = createAsyncThunk(
  'marketing/getNotifications',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.MARKETING.NOTIFICATIONS.GET_ALL, { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createNotification = createAsyncThunk(
  'marketing/createNotification',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.MARKETING.NOTIFICATIONS.CREATE, data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateLoyaltyProgram = createAsyncThunk(
  'marketing/updateLoyaltyProgram',
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.MARKETING.LOYALTY.UPDATE(userId), data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const marketingSlice = createSlice({
  name: 'marketing',
  initialState: {
    campaigns: [],
    loyaltyPrograms: [],
    notifications: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getCampaigns.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCampaigns.fulfilled, (state, action) => {
        state.isLoading = false;
        state.campaigns = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getLoyaltyPrograms.fulfilled, (state, action) => {
        state.loyaltyPrograms = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.notifications = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(createCampaign.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        state.campaigns.push(action.payload);
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.notifications.unshift(action.payload);
      })
      .addCase(updateLoyaltyProgram.fulfilled, (state, action) => {
        const index = state.loyaltyPrograms.findIndex(p => p.userId === action.payload.userId || p.userId?._id === action.payload.userId?._id);
        if (index !== -1) {
          state.loyaltyPrograms[index] = action.payload;
        } else {
          state.loyaltyPrograms.unshift(action.payload);
        }
      });
  },
});

export default marketingSlice.reducer;


