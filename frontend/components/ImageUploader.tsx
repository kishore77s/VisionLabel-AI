"use client";

import { DragEvent, useRef, useState } from "react";

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
}

export default function ImageUploader({
  onFileSelect,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a JPG, JPEG or PNG image.");
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      validateFile(file);
    }
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => {
        setIsDragging(false);
      }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`group cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition ${
        isDragging
          ? "border-white bg-slate-800"
          : "border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-900/80"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            validateFile(file);
          }

          event.target.value = "";
        }}
      />

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-2xl transition group-hover:scale-105">
        ↑
      </div>

      <h3 className="mt-6 text-lg font-semibold">
        Drop your image here
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        or click to browse from your computer
      </p>

      <div className="mt-6 flex justify-center gap-2">
        <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
          JPG
        </span>

        <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
          JPEG
        </span>

        <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
          PNG
        </span>
      </div>
    </div>
  );
}