import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import { ENDPOINTS } from '../../api/endpoints';

export const getOrders = createAsyncThunk(
  'orders/getOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.ORDERS.GET_ALL);
      // Handle multiple response formats:
      // 1. { success: true, data: [...] } - from routes/orderController
      // 2. { success: true, orders: [...] } - from src/controllers/orderController
      // 3. { data: [...] } - alternative format
      // 4. [...] - direct array
      const orders = response.data?.data || response.data?.orders || response.data || [];
      return Array.isArray(orders) ? orders : [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch orders');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.ORDERS.CREATE, orderData);
      // Handle both response.data.data and response.data formats
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to create order');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      // Use the status update endpoint with status in body
      const response = await api.put(ENDPOINTS.ORDERS.UPDATE_STATUS(id), { status });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update order status');
    }
  }
);

export const assignRider = createAsyncThunk(
  'orders/assignRider',
  async ({ orderId, riderId }, { rejectWithValue }) => {
    try {
      // Use the assign rider endpoint
      const response = await api.put(ENDPOINTS.ORDERS.ASSIGN_RIDER(orderId), { 
        riderId
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to assign rider');
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.orders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload);
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(order => order._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(assignRider.fulfilled, (state, action) => {
        const index = state.orders.findIndex(order => order._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      });
  },
});

export default orderSlice.reducer;











