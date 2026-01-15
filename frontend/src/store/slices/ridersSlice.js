import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import { ENDPOINTS } from '../../api/endpoints';

export const getRiders = createAsyncThunk(
  'riders/getRiders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.RIDERS.GET_ALL);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch riders');
    }
  }
);

export const createRider = createAsyncThunk(
  'riders/createRider',
  async (riderData, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.RIDERS.CREATE, riderData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create rider');
    }
  }
);

export const updateRider = createAsyncThunk(
  'riders/updateRider',
  async ({ id, riderData }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.RIDERS.UPDATE(id), riderData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update rider');
    }
  }
);

export const updateAvailability = createAsyncThunk(
  'riders/updateAvailability',
  async ({ id, availability }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.RIDERS.UPDATE_AVAILABILITY(id), { availability });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update availability');
    }
  }
);

export const deleteRider = createAsyncThunk(
  'riders/deleteRider',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(ENDPOINTS.RIDERS.DELETE(id));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete rider');
    }
  }
);

// Get available riders for order assignment
export const getAvailableRiders = createAsyncThunk(
  'riders/getAvailableRiders',
  async (branchId, { rejectWithValue }) => {
    try {
      const url = branchId
        ? `${ENDPOINTS.RIDERS.GET_AVAILABLE}?branch=${branchId}`
        : ENDPOINTS.RIDERS.GET_AVAILABLE;
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch available riders');
    }
  }
);

// Get rider's assigned orders
export const getRiderOrders = createAsyncThunk(
  'riders/getRiderOrders',
  async (riderId, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.RIDERS.GET_ORDERS(riderId));
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch rider orders');
    }
  }
);

// Get rider's delivery history
export const getRiderHistory = createAsyncThunk(
  'riders/getRiderHistory',
  async ({ riderId, page = 1, limit = 20, startDate, endDate }, { rejectWithValue }) => {
    try {
      let url = `${ENDPOINTS.RIDERS.GET_HISTORY(riderId)}?page=${page}&limit=${limit}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch rider history');
    }
  }
);

// Get rider statistics
export const getRiderStats = createAsyncThunk(
  'riders/getRiderStats',
  async (riderId, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.RIDERS.GET_STATS(riderId));
      return { riderId, stats: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch rider stats');
    }
  }
);

const ridersSlice = createSlice({
  name: 'riders',
  initialState: {
    riders: [],
    availableRiders: [],
    selectedRiderOrders: [],
    selectedRiderHistory: [],
    selectedRiderStats: null,
    historyPagination: null,
    isLoading: false,
    isLoadingOrders: false,
    isLoadingHistory: false,
    isLoadingStats: false,
    error: null,
  },
  reducers: {
    clearSelectedRiderData: (state) => {
      state.selectedRiderOrders = [];
      state.selectedRiderHistory = [];
      state.selectedRiderStats = null;
      state.historyPagination = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRiders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getRiders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.riders = action.payload;
      })
      .addCase(getRiders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createRider.fulfilled, (state, action) => {
        state.riders.push(action.payload);
      })
      .addCase(updateRider.fulfilled, (state, action) => {
        const index = state.riders.findIndex(rider => rider._id === action.payload._id);
        if (index !== -1) {
          state.riders[index] = action.payload;
        }
      })
      .addCase(updateAvailability.fulfilled, (state, action) => {
        const index = state.riders.findIndex(rider => rider._id === action.payload._id);
        if (index !== -1) {
          state.riders[index] = action.payload;
        }
      })
      .addCase(deleteRider.fulfilled, (state, action) => {
        state.riders = state.riders.filter(rider => rider._id !== action.payload);
      })
      // Available riders
      .addCase(getAvailableRiders.fulfilled, (state, action) => {
        state.availableRiders = action.payload;
      })
      // Rider orders
      .addCase(getRiderOrders.pending, (state) => {
        state.isLoadingOrders = true;
      })
      .addCase(getRiderOrders.fulfilled, (state, action) => {
        state.isLoadingOrders = false;
        state.selectedRiderOrders = action.payload;
      })
      .addCase(getRiderOrders.rejected, (state, action) => {
        state.isLoadingOrders = false;
        state.error = action.payload;
      })
      // Rider history
      .addCase(getRiderHistory.pending, (state) => {
        state.isLoadingHistory = true;
      })
      .addCase(getRiderHistory.fulfilled, (state, action) => {
        state.isLoadingHistory = false;
        state.selectedRiderHistory = action.payload.data;
        state.historyPagination = action.payload.pagination;
      })
      .addCase(getRiderHistory.rejected, (state, action) => {
        state.isLoadingHistory = false;
        state.error = action.payload;
      })
      // Rider stats
      .addCase(getRiderStats.pending, (state) => {
        state.isLoadingStats = true;
      })
      .addCase(getRiderStats.fulfilled, (state, action) => {
        state.isLoadingStats = false;
        state.selectedRiderStats = action.payload.stats;

        // Update the rider in the list with stats
        const index = state.riders.findIndex(r => r._id === action.payload.riderId);
        if (index !== -1) {
          state.riders[index].stats = action.payload.stats;
        }
      })
      .addCase(getRiderStats.rejected, (state, action) => {
        state.isLoadingStats = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedRiderData } = ridersSlice.actions;
export default ridersSlice.reducer;
