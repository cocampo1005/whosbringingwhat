import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CategoryList from './CategoryList';

vi.mock('./AssigneeAvatar', () => ({
  default: ({ displayName }) => (
    <span data-testid="assignee-avatar">{displayName}</span>
  ),
}));

describe('CategoryList - On Behalf Of display', () => {
  const baseProps = {
    categoryName: 'Main',
    categoryColor: 'text-gray-800',
    dietaryIcons: {},
    onEditItem: vi.fn(),
    onDeleteItem: vi.fn(),
    canManageItem: () => true,
    defaultExpanded: true,
  };

  it('uses onBehalfOfName for display when present', () => {
    const items = [
      {
        id: '1',
        title: 'Salad',
        assignee: 'Alice',
        assigneeId: 'uid1',
        onBehalfOfName: 'Grandma',
        isOnBehalfOf: true,
        dietary: [],
      },
    ];

    render(<CategoryList {...baseProps} items={items} />);

    const avatar = screen.getByTestId('assignee-avatar');
    expect(avatar).toHaveTextContent('Grandma');
  });

  it('falls back to assignee when onBehalfOfName is absent', () => {
    const items = [
      {
        id: '1',
        title: 'Salad',
        assignee: 'Alice',
        assigneeId: 'uid1',
        dietary: [],
      },
    ];

    render(<CategoryList {...baseProps} items={items} />);

    const avatar = screen.getByTestId('assignee-avatar');
    expect(avatar).toHaveTextContent('Alice');
  });
});
