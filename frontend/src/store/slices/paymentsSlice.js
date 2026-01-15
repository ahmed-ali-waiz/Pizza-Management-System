import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import { ENDPOINTS } from '../../api/endpoints';

export const getPayments = createAsyncThunk(
  'payments/getPayments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.PAYMENTS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch payments');
    }
  }
);

export const getPaymentStats = createAsyncThunk(
  'payments/getPaymentStats',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.PAYMENTS.GET_STATS, { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch payment stats');
    }
  }
);

export const getPayment = createAsyncThunk(
  'payments/getPayment',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.PAYMENTS.GET_ONE(id));
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch payment');
    }
  }
);

export const updatePaymentStatus = createAsyncThunk(
  'payments/updatePaymentStatus',
  async ({ id, status, transactionId }, { rejectWithValue }) => {
    try {
      const response = await api.patch(ENDPOINTS.PAYMENTS.UPDATE_STATUS(id), {
        status,
        transactionId,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update payment status');
    }
  }
);

export const processRefund = createAsyncThunk(
  'payments/processRefund',
  async ({ id, amount, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.PAYMENTS.PROCESS_REFUND(id), {
        amount,
        reason,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to process refund');
    }
  }
);

// Create Stripe Payment Intent
export const createPaymentIntent = createAsyncThunk(
  'payments/createPaymentIntent',
  async ({ orderId, amount, currency = 'usd' }, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.PAYMENTS.CREATE_INTENT, {
        orderId,
        amount,
        currency,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create payment intent');
    }
  }
);

// Confirm Stripe Payment
export const confirmPayment = createAsyncThunk(
  'payments/confirmPayment',
  async ({ paymentIntentId, paymentMethodId }, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.PAYMENTS.CONFIRM, {
        paymentIntentId,
        paymentMethodId,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to confirm payment');
    }
  }
);

// Verify Payment
export const verifyPayment = createAsyncThunk(
  'payments/verifyPayment',
  async ({ paymentIntentId }, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.PAYMENTS.VERIFY, {
        paymentIntentId,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to verify payment');
    }
  }
);

// Process Cash Payment
export const processCashPayment = createAsyncThunk(
  'payments/processCashPayment',
  async ({ orderId, amountReceived }, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.PAYMENTS.CASH, {
        orderId,
        amountReceived,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to process cash payment');
    }
  }
);

// Get Payments by Order
export const getPaymentsByOrder = createAsyncThunk(
  'payments/getPaymentsByOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.PAYMENTS.GET_BY_ORDER(orderId));
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch order payments');
    }
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    payments: [],
    stats: null,
    currentPayment: null,
    pagination: null,
    isLoading: false,
    error: null,
    // Checkout state
    paymentIntent: null,
    clientSecret: null,
    checkoutLoading: false,
    checkoutError: null,
    paymentSuccess: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.checkoutError = null;
    },
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    },
    clearCheckout: (state) => {
      state.paymentIntent = null;
      state.clientSecret = null;
      state.checkoutError = null;
      state.paymentSuccess = false;
    },
    setPaymentSuccess: (state, action) => {
      state.paymentSuccess = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Payments
      .addCase(getPayments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle both response.data format and direct data format
        if (Array.isArray(action.payload)) {
          state.payments = action.payload;
          state.pagination = null;
        } else {
          state.payments = action.payload.data || [];
          state.pagination = action.payload.pagination || null;
        }
      })
      .addCase(getPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Payment Stats
      .addCase(getPaymentStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPaymentStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(getPaymentStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Single Payment
      .addCase(getPayment.fulfilled, (state, action) => {
        state.currentPayment = action.payload;
      })
      // Update Payment Status
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        const index = state.payments.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
      })
      // Process Refund
      .addCase(processRefund.fulfilled, (state, action) => {
        const index = state.payments.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
      })
      // Create Payment Intent
      .addCase(createPaymentIntent.pending, (state) => {
        state.checkoutLoading = true;
        state.checkoutError = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.checkoutLoading = false;
        state.paymentIntent = action.payload.paymentIntentId;
        state.clientSecret = action.payload.clientSecret;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.checkoutError = action.payload;
      })
      // Confirm Payment
      .addCase(confirmPayment.pending, (state) => {
        state.checkoutLoading = true;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.checkoutLoading = false;
        state.paymentSuccess = true;
        state.currentPayment = action.payload.payment;
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.checkoutError = action.payload;
      })
      // Verify Payment
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.paymentSuccess = action.payload.verified;
      })
      // Process Cash Payment
      .addCase(processCashPayment.pending, (state) => {
        state.checkoutLoading = true;
      })
      .addCase(processCashPayment.fulfilled, (state, action) => {
        state.checkoutLoading = false;
        state.paymentSuccess = true;
        state.currentPayment = action.payload.payment;
      })
      .addCase(processCashPayment.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.checkoutError = action.payload;
      });
  },
});

export const { clearError, clearCurrentPayment, clearCheckout, setPaymentSuccess } = paymentsSlice.actions;
export default paymentsSlice.reducer;





















