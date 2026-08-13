"use client";

import { useEffect, useState } from "react";

interface Detection {
  label: string;
  confidence: number;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface AnnotationCanvasProps {
  imageUrl: string;
  detections: Detection[];
}

interface ImageDimensions {
  naturalWidth: number;
  naturalHeight: number;
  displayWidth: number;
  displayHeight: number;
}

export default function AnnotationCanvas({
  imageUrl,
  detections,
}: AnnotationCanvasProps) {
  const [imageDimensions, setImageDimensions] =
    useState<ImageDimensions | null>(null);

  const updateDimensions = (image: HTMLImageElement) => {
    setImageDimensions({
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      displayWidth: image.clientWidth,
      displayHeight: image.clientHeight,
    });
  };

  useEffect(() => {
    const handleResize = () => {
      const image = document.querySelector(
        "[data-annotation-image]"
      ) as HTMLImageElement | null;

      if (image) {
        updateDimensions(image);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex min-h-400 items-center justify-center rounded-xl bg-black p-4">
      <div className="relative inline-block max-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-annotation-image
          src={imageUrl}
          alt="Image being analyzed"
          onLoad={(event) => {
            updateDimensions(event.currentTarget);
          }}
          className="block max-h-650 max-w-full rounded-lg object-contain"
        />

        {imageDimensions &&
          detections.map((detection, index) => {
            const {
              naturalWidth,
              naturalHeight,
              displayWidth,
              displayHeight,
            } = imageDimensions;

            if (
              naturalWidth === 0 ||
              naturalHeight === 0 ||
              displayWidth === 0 ||
              displayHeight === 0
            ) {
              return null;
            }

            const scaleX = displayWidth / naturalWidth;
            const scaleY = displayHeight / naturalHeight;

            const left = detection.bbox.x1 * scaleX;
            const top = detection.bbox.y1 * scaleY;

            const width =
              (detection.bbox.x2 - detection.bbox.x1) *
              scaleX;

            const height =
              (detection.bbox.y2 - detection.bbox.y1) *
              scaleY;

            return (
              <div
                key={`${detection.label}-${index}`}
                className="pointer-events-none absolute"
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                }}
              >
                {/* Bounding box */}
                <div className="absolute inset-0 border-2 border-white" />

                {/* Label */}
                <div className="absolute -top-7 left-0 whitespace-nowrap rounded-md bg-white px-2 py-1 text-xs font-semibold capitalize text-slate-950 shadow-lg">
                  {detection.label}{" "}
                  {(detection.confidence * 100).toFixed(0)}%
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}