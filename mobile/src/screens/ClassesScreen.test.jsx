import React from 'react';
import { renderWithProviders } from '../test-utils/renderWithProviders';
import { ClassesScreen } from './ClassesScreen';

jest.mock('../api/client');

describe('ClassesScreen', () => {
  it('renders the heading and an empty state without crashing', async () => {
    const { findByText } = await renderWithProviders(<ClassesScreen />);

    // "Classes" itself appears twice (page heading + a stat card label) — the subtitle is unique.
    expect(await findByText('Sections and subject-teacher assignments')).toBeTruthy();
  });
});
