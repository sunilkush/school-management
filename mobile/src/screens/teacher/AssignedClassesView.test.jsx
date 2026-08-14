import React from 'react';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { AssignedClassesView } from './AssignedClassesView';

jest.mock('../../api/client');

describe('AssignedClassesView', () => {
  it('renders the empty state without crashing when no classes are assigned', async () => {
    const { findByText } = await renderWithProviders(<AssignedClassesView />);

    expect(await findByText('No classes assigned to you yet')).toBeTruthy();
  });
});
