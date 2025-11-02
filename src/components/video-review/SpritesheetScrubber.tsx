// Spritesheet Scrubber Component (Story 2.7, AC#3)
// Frame-by-frame preview on hover

'use client';

import { useState, useRef, useEffect } from 'react';

type SpritesheetScrubberProps = {
  spritesheetUrl: string;
  framesPerRow?: number; // Number of frames per row in spritesheet
  totalFrames?: number; // Total number of frames
};

/**
 * Spritesheet Scrubber (Story 2.7, AC#3)
 * Shows frame-by-frame preview when hovering over video thumbnail
 */
export function SpritesheetScrubber({
  spritesheetUrl,
  framesPerRow = 5,
  totalFrames = 25,
}: SpritesheetScrubberProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate spritesheet dimensions
  const rows = Math.ceil(totalFrames / framesPerRow);
  const frameWidth = 100 / framesPerRow; // % width per frame
  const frameHeight = 100 / rows; // % height per frame

  // Handle mouse move to scrub through frames
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;

    // Calculate which frame to show based on mouse position
    const frameIndex = Math.floor(percentage * totalFrames);
    const clampedFrame = Math.max(0, Math.min(frameIndex, totalFrames - 1));

    setCurrentFrame(clampedFrame);
  };

  // Calculate background position for current frame
  const getBackgroundPosition = () => {
    const column = currentFrame % framesPerRow;
    const row = Math.floor(currentFrame / framesPerRow);

    const x = column * frameWidth;
    const y = row * frameHeight;

    return `${x}% ${y}%`;
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-black bg-opacity-80 cursor-ew-resize"
      onMouseMove={handleMouseMove}
    >
      {/* Spritesheet Frame Display */}
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `url(${spritesheetUrl})`,
          backgroundSize: `${framesPerRow * 100}% ${rows * 100}%`,
          backgroundPosition: getBackgroundPosition(),
          backgroundRepeat: 'no-repeat',
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
        onLoad={() => setImageLoaded(true)}
      />

      {/* Scrubber Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
        <div
          className="h-full bg-blue-500 transition-all duration-100"
          style={{ width: `${((currentFrame + 1) / totalFrames) * 100}%` }}
        />
      </div>

      {/* Frame Counter */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
        Frame {currentFrame + 1} / {totalFrames}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-3 py-1 rounded">
        Move cursor to scrub
      </div>
    </div>
  );
}
