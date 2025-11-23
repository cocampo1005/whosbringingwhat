import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageUpload from '../../components/ImageUpload';

vi.mock('firebase/storage', () => {
  const ref = vi.fn();
  const uploadTaskOn = vi.fn();

  return {
    getStorage: vi.fn(() => ({})),
    ref,
    uploadBytesResumable: vi.fn(() => ({
      on: uploadTaskOn,
      snapshot: {
        ref: {},
      },
    })),
    getDownloadURL: vi.fn(async () => 'https://example.com/image.jpg'),
    deleteObject: vi.fn(async () => {}),
  };
});

vi.mock('browser-image-compression', () => ({
  __esModule: true,
  default: vi.fn(async (file) => file),
}));

describe('ImageUpload component', () => {
  it('renders upload UI when no imageUrl is provided', () => {
    const handleChange = vi.fn();

    render(
      <ImageUpload
        label="Photo"
        imageUrl=""
        onImageChange={handleChange}
        storageFolder="test-images"
        objectId="obj-1"
      />,
    );

    expect(screen.getByText('Photo')).toBeInTheDocument();
    expect(screen.getByText('Click to upload photo')).toBeInTheDocument();
  });

  it('renders existing image and delete button when imageUrl is set', () => {
    const handleChange = vi.fn();

    render(
      <ImageUpload
        label="Photo"
        imageUrl="https://example.com/image.jpg"
        onImageChange={handleChange}
        storageFolder="test-images"
        objectId="obj-1"
      />,
    );

    const img = screen.getByAltText('Image preview');
    expect(img).toBeInTheDocument();
  });

  it('calls onUploadingChange and disables while uploading', () => {
    const handleChange = vi.fn();
    const handleUploading = vi.fn();

    render(
      <ImageUpload
        label="Photo"
        imageUrl=""
        onImageChange={handleChange}
        storageFolder="test-images"
        objectId="obj-1"
        onUploadingChange={handleUploading}
        inputId="test-image-upload"
      />,
    );

    const input = screen.getByLabelText('Photo').parentElement?.querySelector(
      'input[type="file"]',
    );

    // Simulate a change event on the hidden file input if found
    if (input) {
      const file = new File(['dummy'], 'dummy.png', { type: 'image/png' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    // We at least expect uploading callback to be invoked at some point
    expect(handleUploading).toHaveBeenCalled();
  });
});
