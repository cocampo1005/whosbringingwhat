import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EventModal from '../../components/EventModal';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'user-1', name: 'Host User' } }),
}));

// Stub out ImageUpload so we can control when imageUrl changes
vi.mock('../../components/ImageUpload', () => ({
  __esModule: true,
  default: ({ label, onImageChange }) => (
    <div>
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onImageChange('https://example.com/event.jpg')}
      >
        Mock Upload
      </button>
    </div>
  ),
}));

describe('EventModal with image upload', () => {
  const defaultProps = {
    closeModal: vi.fn(),
    onSubmit: vi.fn(),
    initialData: {},
  };

  it('includes imageUrl from ImageUpload in submitted data', () => {
    const onSubmit = vi.fn();
    const closeModal = vi.fn();

    render(<EventModal {...defaultProps} onSubmit={onSubmit} closeModal={closeModal} />);

    // Fill minimal required fields
    fireEvent.change(screen.getByLabelText(/Event Name/i), {
      target: { value: 'My Event' },
    });

    // Use calendar: the component expects a Date
    const today = new Date();
    // Simulate date selection via Calendar's onChange handler by firing change on the underlying input is tricky;
    // instead, we trust Calendar and directly set the internal state via handleDateChange is not exposed.
    // To keep this test focused on image integration, we bypass validation by setting date via a custom event.
    // eslint-disable-next-line testing-library/no-node-access
    fireEvent.change(screen.getByText('Date').nextSibling, {
      target: { value: today },
    });

    fireEvent.change(screen.getByLabelText(/Time/i), {
      target: { value: '18:00' },
    });

    fireEvent.change(screen.getByLabelText(/Location/i), {
      target: { value: 'Test Location' },
    });

    // Trigger mock upload
    fireEvent.click(screen.getByText('Mock Upload'));

    const submitButton = screen.getByRole('button', { name: /Add Event/i });
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.imageUrl).toBe('https://example.com/event.jpg');
  });
});
