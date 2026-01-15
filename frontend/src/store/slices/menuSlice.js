import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import { ENDPOINTS } from '../../api/endpoints';

export const getMenuItems = createAsyncThunk(
  'menu/getMenuItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.MENU.GET_ALL);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch menu items');
    }
  }
);

export const createMenuItem = createAsyncThunk(
  'menu/createMenuItem',
  async (menuData, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.MENU.CREATE, menuData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create menu item');
    }
  }
);

export const updateMenuItem = createAsyncThunk(
  'menu/updateMenuItem',
  async ({ id, menuData }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.MENU.UPDATE(id), menuData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update menu item');
    }
  }
);

export const deleteMenuItem = createAsyncThunk(
  'menu/deleteMenuItem',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(ENDPOINTS.MENU.DELETE(id));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete menu item');
    }
  }
);

const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    menuItems: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getMenuItems.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMenuItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.menuItems = action.payload;
      })
      .addCase(getMenuItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.menuItems.push(action.payload);
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        const index = state.menuItems.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.menuItems[index] = action.payload;
        }
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.menuItems = state.menuItems.filter(item => item._id !== action.payload);
      });
  },
});

export default menuSlice.reducer;





















