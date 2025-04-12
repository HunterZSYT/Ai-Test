"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  position: number;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // If no images are provided, show a placeholder
  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-square w-full bg-gray-100 overflow-hidden rounded-lg">
        <div className="flex h-full items-center justify-center">
          <span className="text-gray-400">No image available</span>
        </div>
      </div>
    );
  }

  // Sort images by position
  const sortedImages = [...images].sort((a, b) => a.position - b.position);
  const selectedImage = sortedImages[selectedImageIndex];

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={selectedImage.url}
          alt={selectedImage.alt_text || productName}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={selectedImageIndex === 0} // Prioritize loading the first image
        />
      </div>

      {/* Image thumbnails */}
      {sortedImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              className={`relative aspect-square overflow-hidden rounded-md ${
                selectedImageIndex === index
                  ? "ring-2 ring-blue-500"
                  : "ring-1 ring-gray-200"
              }`}
              onClick={() => setSelectedImageIndex(index)}
              aria-label={`View image ${index + 1} of ${sortedImages.length}`}
            >
              <Image
                src={image.url}
                alt={image.alt_text || `${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 20vw, 10vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}