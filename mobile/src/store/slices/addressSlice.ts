import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';

export interface Address {
  _id: string;
  fullName: string;
  mobile: string;
  houseNo: string;
  building?: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  addressType: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
}

interface AddressState {
  addresses: Address[];
  loading: boolean;
  error: string | null;
  selectedCheckoutAddress: Address | null;
}

const initialState: AddressState = {
  addresses: [],
  loading: false,
  error: null,
  selectedCheckoutAddress: null,
};

export const fetchAddresses = createAsyncThunk('address/fetchAddresses', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get('/customer/address');
    if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch addresses');
    return response.data.addresses as Address[];
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addAddress = createAsyncThunk('address/addAddress', async (addressData: Partial<Address>, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/customer/address', addressData);
    if (!response.data.success) throw new Error(response.data.message || 'Failed to add address');
    return response.data.address as Address;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateAddress = createAsyncThunk('address/updateAddress', async ({ id, addressData }: { id: string, addressData: Partial<Address> }, { rejectWithValue }) => {
  try {
    const response = await apiClient.put(`/customer/address/${id}`, addressData);
    if (!response.data.success) throw new Error(response.data.message || 'Failed to update address');
    return response.data.address as Address;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteAddress = createAsyncThunk('address/deleteAddress', async (id: string, { rejectWithValue }) => {
  try {
    const response = await apiClient.delete(`/customer/address/${id}`);
    if (!response.data.success) throw new Error(response.data.message || 'Failed to delete address');
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const setDefaultAddress = createAsyncThunk('address/setDefaultAddress', async (id: string, { rejectWithValue }) => {
  try {
    const response = await apiClient.patch(`/customer/address/${id}/default`);
    if (!response.data.success) throw new Error(response.data.message || 'Failed to set default address');
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    setSelectedCheckoutAddress: (state, action: PayloadAction<Address | null>) => {
      state.selectedCheckoutAddress = action.payload;
    },
    clearAddresses: (state) => {
      state.addresses = [];
      state.selectedCheckoutAddress = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
        if (!state.selectedCheckoutAddress) {
          state.selectedCheckoutAddress = action.payload.find(a => a.isDefault) || action.payload[0] || null;
        }
      })
      .addCase(fetchAddresses.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      
      .addCase(addAddress.fulfilled, (state, action) => {
        if (action.payload.isDefault) {
          state.addresses.forEach(a => a.isDefault = false);
        }
        state.addresses.unshift(action.payload);
        if (action.payload.isDefault || state.addresses.length === 1) {
            state.selectedCheckoutAddress = action.payload;
        }
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        if (action.payload.isDefault) {
          state.addresses.forEach(a => a.isDefault = false);
        }
        const index = state.addresses.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.addresses[index] = action.payload;
        }
        if (state.selectedCheckoutAddress?._id === action.payload._id) {
            state.selectedCheckoutAddress = action.payload;
        }
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.filter(a => a._id !== action.payload);
        if (state.selectedCheckoutAddress?._id === action.payload) {
            state.selectedCheckoutAddress = state.addresses.find(a => a.isDefault) || state.addresses[0] || null;
        }
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.addresses.forEach(a => {
          a.isDefault = a._id === action.payload;
        });
      });
  }
});

export const { setSelectedCheckoutAddress, clearAddresses } = addressSlice.actions;
export default addressSlice.reducer;
