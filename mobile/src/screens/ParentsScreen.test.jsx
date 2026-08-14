import React from 'react';
import { renderWithProviders } from '../test-utils/renderWithProviders';
import { ParentsScreen } from './ParentsScreen';

jest.mock('../api/client');

describe('ParentsScreen', () => {
  it('renders the directory heading without crashing', async () => {
    const { findByText } = await renderWithProviders(<ParentsScreen />);

    expect(await findByText('Parents Directory')).toBeTruthy();
  });
});
