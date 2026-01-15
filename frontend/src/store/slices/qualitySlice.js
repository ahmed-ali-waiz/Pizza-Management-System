import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import { ENDPOINTS } from '../../api/endpoints';

export const getReviews = createAsyncThunk(
  'quality/getReviews',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.QUALITY.REVIEWS.GET_ALL, { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateReviewStatus = createAsyncThunk(
  'quality/updateReviewStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.QUALITY.REVIEWS.UPDATE_STATUS(id), { status });
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const getComplaints = createAsyncThunk(
  'quality/getComplaints',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.QUALITY.COMPLAINTS.GET_ALL, { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const resolveComplaint = createAsyncThunk(
  'quality/resolveComplaint',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.QUALITY.COMPLAINTS.RESOLVE(id), data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const assignComplaint = createAsyncThunk(
  'quality/assignComplaint',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.QUALITY.COMPLAINTS.ASSIGN(id), data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const qualitySlice = createSlice({
  name: 'quality',
  initialState: {
    reviews: [],
    complaints: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getReviews.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getComplaints.fulfilled, (state, action) => {
        state.complaints = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(updateReviewStatus.fulfilled, (state, action) => {
        const index = state.reviews.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
      })
      .addCase(resolveComplaint.fulfilled, (state, action) => {
        const index = state.complaints.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.complaints[index] = action.payload;
        }
      })
      .addCase(assignComplaint.fulfilled, (state, action) => {
        const index = state.complaints.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.complaints[index] = action.payload;
        }
      });
  },
});

export default qualitySlice.reducer;


