import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { createElement, type ReactElement } from 'react';
import userReducer from '@/features/user/userSlice';
import listingsReducer from '@/features/listings/listingsSlice';
import filtersReducer from '@/features/filters/filtersSlice';
import forumReducer from '@/features/forum/forumSlice';
import uiReducer from '@/features/ui/uiSlice';
import favoritesReducer from '@/features/favorites/favoritesSlice';
function createTestStore() {
    return configureStore({
        reducer: {
            user: userReducer,
            listings: listingsReducer,
            filters: filtersReducer,
            forum: forumReducer,
            ui: uiReducer,
            favorites: favoritesReducer,
        },
    });
}
function renderWithProviders(ui: ReactElement) {
    const store = createTestStore();
    const wrapped = createElement(MemoryRouter, null, ui);
    const withStore = createElement(Provider, { store, children: wrapped });
    return render(createElement(HelmetProvider, { children: withStore }));
}

export {
  createTestStore,
  renderWithProviders,
}
