import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import { ENDPOINTS } from '../../api/endpoints';

export const getBranches = createAsyncThunk(
  'branches/getBranches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.BRANCHES.GET_ALL);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch branches');
    }
  }
);

export const createBranch = createAsyncThunk(
  'branches/createBranch',
  async (branchData, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.BRANCHES.CREATE, branchData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create branch');
    }
  }
);

export const updateBranch = createAsyncThunk(
  'branches/updateBranch',
  async ({ id, branchData }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.BRANCHES.UPDATE(id), branchData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update branch');
    }
  }
);

export const deleteBranch = createAsyncThunk(
  'branches/deleteBranch',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(ENDPOINTS.BRANCHES.DELETE(id));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete branch');
    }
  }
);

const branchSlice = createSlice({
  name: 'branches',
  initialState: {
    branches: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getBranches.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBranches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.branches = action.payload;
      })
      .addCase(getBranches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createBranch.fulfilled, (state, action) => {
        state.branches.push(action.payload);
      })
      .addCase(updateBranch.fulfilled, (state, action) => {
        const index = state.branches.findIndex(branch => branch._id === action.payload._id);
        if (index !== -1) {
          state.branches[index] = action.payload;
        }
      })
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.branches = state.branches.filter(branch => branch._id !== action.payload);
      });
  },
});

export default branchSlice.reducer;
