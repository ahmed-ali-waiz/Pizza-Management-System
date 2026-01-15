import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import { ENDPOINTS } from '../../api/endpoints';

export const getShifts = createAsyncThunk(
  'operations/getShifts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.OPERATIONS.SHIFTS.GET_ALL, { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createShift = createAsyncThunk(
  'operations/createShift',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.OPERATIONS.SHIFTS.CREATE, data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const getTasks = createAsyncThunk(
  'operations/getTasks',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.OPERATIONS.TASKS.GET_ALL, { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createTask = createAsyncThunk(
  'operations/createTask',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.OPERATIONS.TASKS.CREATE, data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const getAttendance = createAsyncThunk(
  'operations/getAttendance',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(ENDPOINTS.OPERATIONS.ATTENDANCE.GET_ALL, { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createAttendance = createAsyncThunk(
  'operations/createAttendance',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(ENDPOINTS.OPERATIONS.ATTENDANCE.CREATE, data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateShift = createAsyncThunk(
  'operations/updateShift',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.OPERATIONS.SHIFTS.UPDATE(id), data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deleteShift = createAsyncThunk(
  'operations/deleteShift',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(ENDPOINTS.OPERATIONS.SHIFTS.DELETE(id));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateTask = createAsyncThunk(
  'operations/updateTask',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.OPERATIONS.TASKS.UPDATE(id), data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'operations/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(ENDPOINTS.OPERATIONS.TASKS.DELETE(id));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateAttendance = createAsyncThunk(
  'operations/updateAttendance',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(ENDPOINTS.OPERATIONS.ATTENDANCE.UPDATE(id), data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const operationsSlice = createSlice({
  name: 'operations',
  initialState: {
    shifts: [],
    tasks: [],
    attendance: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getShifts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getShifts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.shifts = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getTasks.fulfilled, (state, action) => {
        state.tasks = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getAttendance.fulfilled, (state, action) => {
        state.attendance = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(createAttendance.fulfilled, (state, action) => {
        state.attendance.push(action.payload);
      })
      .addCase(createShift.fulfilled, (state, action) => {
        state.shifts.push(action.payload);
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      .addCase(updateShift.fulfilled, (state, action) => {
        const index = state.shifts.findIndex(s => s._id === action.payload._id);
        if (index !== -1) {
          state.shifts[index] = action.payload;
        }
      })
      .addCase(deleteShift.fulfilled, (state, action) => {
        state.shifts = state.shifts.filter(s => s._id !== action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t._id !== action.payload);
      })
      .addCase(updateAttendance.fulfilled, (state, action) => {
        const index = state.attendance.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.attendance[index] = action.payload;
        }
      });
  },
});

export default operationsSlice.reducer;


