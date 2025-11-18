'use client';

import { useState, useEffect } from 'react';
import { CreateProductForm } from '../../components/forms/CreateProductForm';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  // State to hold the pasted image file
  const [pastedImage, setPastedImage] = useState<File | null>(null);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      // Check if we're pasting inside an input
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return; // Don't intercept paste in inputs
      }

      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            toast.success('Image pasted from clipboard!');
            setPastedImage(file);
            break; // Stop after finding the first image
          }
        }
      }
    };

    // Add listener
    window.addEventListener('paste', handlePaste);

    // Cleanup
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create Product</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Fill out the form below or press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl+V</kbd> anywhere on the page to paste an image.
      </p>

      {/* Pass the pasted image to the form, and a setter to clear it */}
      <CreateProductForm
        pastedImage={pastedImage}
        onFormSubmit={() => setPastedImage(null)}
      />
    </div>
  );
}