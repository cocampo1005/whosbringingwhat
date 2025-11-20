import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemSidePanel from '../../components/ItemSidePanel';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'user-1', name: 'Test User' } }),
}));

vi.mock('../../contexts/UsersContext', () => ({
  useUsers: () => ({ users: [], status: 'ready' }),
}));

vi.mock('../../components/AssigneeAvatar', () => ({
  default: ({ displayName }) => (
    <div data-testid="assignee-avatar">{displayName}</div>
  ),
}));

describe('ItemSidePanel - On Behalf Of feature', () => {
  const defaultProps = {
    closeModal: vi.fn(),
    onSubmit: vi.fn(),
    initialData: {},
    mode: 'add',
    memberIds: [],
  };

  it('disables assignee controls and shows on-behalf-of input when checkbox is checked', () => {
    render(<ItemSidePanel {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText('e.g., Caesar Salad');
    fireEvent.change(titleInput, { target: { value: 'Salad' } });

    const checkbox = screen.getByLabelText(/On behalf of someone else/i);
    fireEvent.click(checkbox);

    const assigneeInput = screen.getByPlaceholderText(/Type a name/i);
    expect(assigneeInput).toBeDisabled();

    const onBehalfInput = screen.getByPlaceholderText(
      /Name of the person who's bringing what for/i,
    );
    expect(onBehalfInput).toBeInTheDocument();
  });

  it('requires onBehalfOfName when checkbox is checked and includes trimmed values in payload', () => {
    const onSubmit = vi.fn();
    const closeModal = vi.fn();
    render(
      <ItemSidePanel
        {...defaultProps}
        onSubmit={onSubmit}
        closeModal={closeModal}
      />,
    );

    const titleInput = screen.getByPlaceholderText('e.g., Caesar Salad');
    fireEvent.change(titleInput, { target: { value: 'Bread' } });

    const checkbox = screen.getByLabelText(/On behalf of someone else/i);
    fireEvent.click(checkbox);

    const submitButton = screen.getByRole('button', { name: /add item/i });
    expect(submitButton).toBeDisabled();

    const onBehalfInput = screen.getByPlaceholderText(
      /Name of the person who's bringing what for/i,
    );
    fireEvent.change(onBehalfInput, {
      target: { value: '  Grandma  ' },
    });

    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];

    expect(payload.onBehalfOfName).toBe('Grandma');
    expect(payload.isOnBehalfOf).toBe(true);
    expect(payload.createdById).toBe('user-1');
    expect(payload.assignee).toBe('Test User');
    expect(payload.assigneeId).toBe('user-1');
  });

  it('pre-populates onBehalfOfName and checkbox from initialData in edit mode', () => {
    const initialData = {
      id: 'item-1',
      title: 'Pie',
      assignee: 'Test User',
      assigneeId: 'user-1',
      onBehalfOfName: 'Grandma',
      isOnBehalfOf: true,
    };

    render(
      <ItemSidePanel
        closeModal={() => {}}
        onSubmit={vi.fn()}
        initialData={initialData}
        mode="edit"
        memberIds={[]}
      />,
    );

    const checkbox = screen.getByLabelText(/On behalf of someone else/i);
    expect(checkbox).toBeChecked();

    const onBehalfInput = screen.getByDisplayValue('Grandma');
    expect(onBehalfInput).toBeInTheDocument();
  });
});
