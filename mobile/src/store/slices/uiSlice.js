import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  themeMode: 'system', // 'system' | 'light' | 'dark'
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setThemeMode(state, action) {
      state.themeMode = action.payload;
    },
  },
});

export const { setThemeMode } = uiSlice.actions;
export default uiSlice.reducer;
