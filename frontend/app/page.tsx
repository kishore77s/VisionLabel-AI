"use client";

import { useEffect, useState } from "react";

import {
  uploadImage as uploadImageApi,
  generateDescription,
  type Detection,
} from "../lib/api";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [, setMediaId] = useState<string | null>(null);
  const [, setMediaUrl] = useState<string | null>(null);

  const [description, setDescription] = useState<string | null>(null);
  const [descriptionModel, setDescriptionModel] = useState<string | null>(null);

  const [, setIsGeneratingDescription] = useState(false);

  /*
   * Clean up the current object URL when the component
   * unmounts or when the preview URL changes.
   *
   * IMPORTANT:
   * There is no setState() inside this effect.
   */
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate image type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    // Clean up the previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create a new browser preview URL
    const newPreviewUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(newPreviewUrl);

    // Reset previous detection results
    setDetections([]);
    setError(null);
  };
  const uploadImage = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setIsUploading(true);
    setIsGeneratingDescription(false);

    setError(null);
    setDetections([]);
    setDescription(null);
    setDescriptionModel(null);
    setMediaId(null);
    setMediaUrl(null);

    try {
      const detectionResult = await uploadImageApi(selectedFile);

      console.log("Detection result:", detectionResult);

      setMediaId(detectionResult.media_id);

      setMediaUrl(`http://127.0.0.1:8000${detectionResult.media_url}`);

      setDetections(detectionResult.detections);

      /*
       * Phase 2:
       * Generate the AI description after
       * object detection has completed.
       */

      setIsGeneratingDescription(true);

      const descriptionResult = await generateDescription(
        selectedFile,
        detectionResult.detections,
        detectionResult.media_id,
      );

      console.log("VLM result:", descriptionResult);

      setDescription(descriptionResult.description);

      setDescriptionModel(descriptionResult.model);
      

    sessionStorage.setItem(
      "visionlabel-review-data",
      JSON.stringify({
        mediaId: detectionResult.media_id,
        mediaUrl: `http://127.0.0.1:8000${detectionResult.media_url}`,
        detections: detectionResult.detections,
        aiDescription: descriptionResult.description,
      }),
    );
    
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while processing the image.",
      );
    } finally {
      setIsUploading(false);
      setIsGeneratingDescription(false);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-[#F4EBDD] text-[#3D2B1F]">
        {/* Hide Next.js development indicator */}
        <style jsx global>{`
          nextjs-portal {
            display: none !important;
          }
        `}</style>

        {/* Header */}
        <header className="border-b border-[#D8C6AE] bg-[#F8F1E7]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4A3326] text-xl font-bold text-[#F8F1E7]">
                V
              </div>

              <div>
                <h1 className="text-base font-bold tracking-tight text-[#3D2B1F]">
                  VisionLabel AI
                </h1>

                <p className="text-xs text-[#8B6F59]">
                  Data Annotation Platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border  px-4 py-2 text-xs font-medium text-[#795C45]">
                YOLO Ready
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <div className="mx-auto max-w-7xl px-6 py-10">
          {/* Hero */}
          <section className="mx-auto max-w-4xl text-center">
            <div className="inline-flex rounded-full border border-[#D8C6AE] bg-[#EEE2D2] px-4 py-2 text-xs font-medium text-[#795C45]">
              Multimodal AI Data Annotation
            </div>

            {/* Changed font only here */}
            <h2 className="mt-8 text-5xl font-bold leading-tight tracking-tight text-[#3D2B1F] md:text-6xl">
              Turn images into
              <br />
              <span className="text-[#9A6846]">structured AI data.</span>
            </h2>

            <p className="mx-auto mt-6 max-w-3xl text-sm leading-7 text-[#795C45] md:text-base">
              Upload an image, automatically detect objects with YOLO, inspect
              bounding boxes, and
              <br className="hidden md:block" />
              generate structured annotation data.
            </p>
          </section>

          {/* Upload */}
          <section className="mx-auto mt-12 max-w-5xl">
            <label
              htmlFor="image-upload"
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#BFA98E] bg-[#F8F1E7] px-6 py-10 transition hover:border-[#9A6846] hover:bg-[#F3E8DA]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8DCCB] text-2xl text-[#6E503C]">
                ↑
              </div>

              <p className="mt-6 text-base font-semibold text-[#3D2B1F]">
                Drop your image here
              </p>

              <p className="mt-2 text-sm text-[#9A7D63]">
                or click to browse from your computer
              </p>

              <div className="mt-5 flex gap-2">
                <span className="rounded-md bg-[#E8DCCB] px-3 py-1 text-xs font-medium text-[#795C45]">
                  JPG
                </span>

                <span className="rounded-md bg-[#E8DCCB] px-3 py-1 text-xs font-medium text-[#795C45]">
                  JPEG
                </span>

                <span className="rounded-md bg-[#E8DCCB] px-3 py-1 text-xs font-medium text-[#795C45]">
                  PNG
                </span>
              </div>

              <input
                id="image-upload"
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </section>

          {/* Selected file / Detect */}
          {selectedFile && (
            <section className="mx-auto mt-6 max-w-5xl rounded-2xl border border-[#D8C6AE] bg-[#F8F1E7] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[#A18469]">
                    Selected file
                  </p>

                  <p className="mt-1 font-medium text-[#4A3326]">
                    {selectedFile.name}
                  </p>
                </div>

                <button
                  onClick={uploadImage}
                  disabled={isUploading}
                  className="rounded-xl bg-[#4A3326] px-6 py-3 text-sm font-semibold text-[#F8F1E7] transition hover:bg-[#624534] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? "Processing..." : "Detect Objects"}
                </button>
              </div>
            </section>
          )}

          {/* Error */}
          {error && (
            <div className="mx-auto mt-6 max-w-5xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <section className="mx-auto mt-8 max-w-5xl rounded-2xl border border-[#D8C6AE] bg-[#F8F1E7] p-6">
              <h3 className="mb-5 text-lg font-semibold text-[#4A3326]">
                Image Preview
              </h3>

              <div className="overflow-hidden rounded-xl bg-[#2E2119] p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Selected image"
                  className="mx-auto max-h-600 w-auto rounded-lg object-contain"
                />
              </div>
            </section>
          )}

          {/* Detection Results */}
          {detections.length > 0 && (
            <section className="mx-auto mt-8 max-w-5xl rounded-2xl border border-[#D8C6AE] bg-[#F8F1E7] p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#4A3326]">
                    Detection Results
                  </h3>

                  <p className="mt-1 text-sm text-[#9A7D63]">
                    YOLO detected {detections.length}{" "}
                    {detections.length === 1 ? "object" : "objects"}
                  </p>
                </div>

                <div className="rounded-full bg-[#E8DCCB] px-3 py-1 text-xs font-medium text-[#795C45]">
                  {detections.length} detected
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {detections.map((detection, index) => (
                  <div
                    key={`${detection.label}-${index}`}
                    className="rounded-xl border border-[#D8C6AE] bg-[#F3E8DA] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold capitalize text-[#4A3326]">
                        {detection.label}
                      </p>

                      <span className="rounded-full bg-[#E4D4C0] px-3 py-1 text-xs font-semibold text-[#795C45]">
                        {(detection.confidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#8B6F59]">
                      <div>X1: {detection.bbox.x1.toFixed(0)}</div>

                      <div>Y1: {detection.bbox.y1.toFixed(0)}</div>

                      <div>X2: {detection.bbox.x2.toFixed(0)}</div>

                      <div>Y2: {detection.bbox.y2.toFixed(0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {description && (
            <section className="mx-auto mt-8 max-w-5xl rounded-2xl border border-[#D8C6AE] bg-[#F8F1E7] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#4A3326]">
                    AI-Generated Description
                  </h3>

                  <p className="mt-1 text-sm text-[#9A7D63]">
                    Generated by {descriptionModel}
                  </p>
                </div>

                <span className="rounded-full bg-[#E8DCCB] px-3 py-1 text-xs font-medium text-[#795C45]">
                  VLM
                </span>
              </div>

              <div className="mt-5 rounded-xl border border-[#D8C6AE] bg-[#F3E8DA] p-5">
                <p className="text-sm leading-7 text-[#4A3326]">
                  {description}
                </p>
              </div>
              <a
                href="/review"
                className="mt-6 inline-flex rounded-xl bg-[#4A3326] px-6 py-3 text-sm font-semibold text-[#F8F1E7] transition hover:bg-[#624534]"
              >
                Open Review Workspace
              </a>
            </section>
          )}

          {/* Feature Cards */}
          <section className="mt-14 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#D8C6AE] bg-[#F8F1E7] p-6">
              <p className="text-xs font-medium text-[#A18469]">01</p>

              <h3 className="mt-8 text-base font-semibold text-[#4A3326]">
                Upload
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#9A7D63]">
                Select an image from your computer.
              </p>
            </div>

            <div className="rounded-xl border border-[#D8C6AE] bg-[#F8F1E7] p-6">
              <p className="text-xs font-medium text-[#A18469]">02</p>

              <h3 className="mt-8 text-base font-semibold text-[#4A3326]">
                Detect
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#9A7D63]">
                YOLO identifies objects automatically.
              </p>
            </div>

            <div className="rounded-xl border border-[#D8C6AE] bg-[#F8F1E7] p-6">
              <p className="text-xs font-medium text-[#A18469]">03</p>

              <h3 className="mt-8 text-base font-semibold text-[#4A3326]">
                Annotate
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#9A7D63]">
                Review labels, confidence and bounding boxes.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#D8C6AE]">
          <div className="mx-auto max-w-7xl px-6 py-6 text-center text-xs text-[#9A7D63]">
            VisionLabel AI · Computer Vision Annotation . Kishore Kumar S
          </div>
        </footer>
      </main>
    </>
  );
}
