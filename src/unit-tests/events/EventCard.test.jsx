import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventCard from '../../components/EventCard';

vi.mock('../../components/ShareButton', () => ({
  default: ({ eventId }) => (
    <button type="button" data-testid={`share-${eventId}`}>
      share
    </button>
  ),
}));

describe('EventCard', () => {
  const baseEvent = {
    id: 'event-1',
    title: 'Test Event',
    date: 'Jan 1, 2025',
    time: '18:00',
    location: 'Test Location',
    description: 'Test description',
    bannerColor: '#111827',
  };

  it('renders hero image when imageUrl is present', () => {
    const events = [{ ...baseEvent, imageUrl: 'https://example.com/image.jpg' }];

    render(<EventCard events={events} />);

    const img = screen.getByAltText('Test Event');
    expect(img).toBeInTheDocument();
  });

  it('renders colored banner when imageUrl is missing', () => {
    const events = [{ ...baseEvent, imageUrl: '' }];

    render(<EventCard events={events} />);

    // There should be no <img>, but the title and share button should render
    expect(screen.queryByAltText('Test Event')).toBeNull();
    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByTestId('share-event-1')).toBeInTheDocument();
  });
});
