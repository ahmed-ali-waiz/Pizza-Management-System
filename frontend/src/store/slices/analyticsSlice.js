import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import { ENDPOINTS } from '../../api/endpoints';

export const getSalesReports = createAsyncThunk(
  'analytics/getSalesReports',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.ANALYTICS.SALES_REPORTS, { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const getCustomerAnalytics = createAsyncThunk(
  'analytics/getCustomerAnalytics',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.ANALYTICS.CUSTOMER_ANALYTICS(userId));
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const getOrderMetrics = createAsyncThunk(
  'analytics/getOrderMetrics',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.ANALYTICS.ORDER_METRICS, { params });
      return response.data?.data || response.data || {};
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const getCustomerStats = createAsyncThunk(
  'analytics/getCustomerStats',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.ANALYTICS.CUSTOMER_STATS, { params });
      const data = response.data?.data || response.data || {};
      // Flatten for easier access
      return {
        ...data,
        activeCustomers: data.summary?.activeCustomers || data.activeCustomers || 0,
        totalCustomers: data.summary?.totalCustomers || data.totalCustomers || 0,
        newCustomers: data.summary?.newCustomers || data.newCustomers || 0,
        growthRate: data.summary?.customerGrowthRate || data.growthRate || 0,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    salesReports: null,
    customerAnalytics: null,
    orderMetrics: null,
    customerStats: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSalesReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSalesReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.salesReports = action.payload || {};
      })
      .addCase(getSalesReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getCustomerAnalytics.fulfilled, (state, action) => {
        state.customerAnalytics = action.payload;
      })
      .addCase(getOrderMetrics.fulfilled, (state, action) => {
        state.orderMetrics = action.payload || {};
      })
      .addCase(getCustomerStats.fulfilled, (state, action) => {
        state.customerStats = action.payload || {};
      });
  },
});

export const { clearError } = analyticsSlice.actions;

export default analyticsSlice.reducer;

