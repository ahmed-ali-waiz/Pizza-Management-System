import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import { ENDPOINTS } from '../../api/endpoints';

export const getExpenses = createAsyncThunk(
  'financial/getExpenses',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.FINANCIAL.EXPENSES.GET_ALL, { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createExpense = createAsyncThunk(
  'financial/createExpense',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.FINANCIAL.EXPENSES.CREATE, data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const approveExpense = createAsyncThunk(
  'financial/approveExpense',
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.FINANCIAL.EXPENSES.APPROVE(id));
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const getRefunds = createAsyncThunk(
  'financial/getRefunds',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.FINANCIAL.REFUNDS.GET_ALL, { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const processRefund = createAsyncThunk(
  'financial/processRefund',
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.FINANCIAL.REFUNDS.PROCESS(id));
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const completeRefund = createAsyncThunk(
  'financial/completeRefund',
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.FINANCIAL.REFUNDS.COMPLETE(id));
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const rejectExpense = createAsyncThunk(
  'financial/rejectExpense',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.FINANCIAL.EXPENSES.REJECT(id), data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const financialSlice = createSlice({
  name: 'financial',
  initialState: {
    expenses: [],
    refunds: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getExpenses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getExpenses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getRefunds.fulfilled, (state, action) => {
        state.refunds = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenses.push(action.payload);
      })
      .addCase(approveExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex(e => e._id === action.payload._id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
      })
      .addCase(processRefund.fulfilled, (state, action) => {
        const index = state.refunds.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.refunds[index] = action.payload;
        }
      })
      .addCase(completeRefund.fulfilled, (state, action) => {
        const index = state.refunds.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.refunds[index] = action.payload;
        }
      })
      .addCase(rejectExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex(e => e._id === action.payload._id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
      });
  },
});

export default financialSlice.reducer;


