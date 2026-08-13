"use client";

import { useEffect, useState } from "react";
import {
  submitReview,
  evaluateReview,
  type EvaluationResponse,
} from "@/lib/api";

type ReviewData = {
  mediaId: string;
  mediaUrl: string;
  detections: {
    label: string;
    confidence: number;
    bbox: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
  }[];
  aiDescription: string;
};

export default function ReviewPage() {
  const [imageSize, setImageSize] = useState({
    width: 1,
    height: 1,
  });

  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  useEffect(() => {
    const storedData = sessionStorage.getItem("visionlabel-review-data");

    if (!storedData) {
      return;
    }

    try {
      const parsedData = JSON.parse(storedData) as ReviewData;

      setReviewData(parsedData);
    } catch (error) {
      console.error("Failed to parse review data:", error);
    }
  }, []);

  const aiDescription = reviewData?.aiDescription ?? "";

  const [correctedDescription, setCorrectedDescription] = useState(
    reviewData?.aiDescription ?? "",
  );

  const aiObjects =
    reviewData?.detections.map((detection) => detection.label) ?? [];

  const [correctedObjects, setCorrectedObjects] = useState(
    reviewData?.detections.map((detection) => detection.label) ?? [],
  );

  useEffect(() => {
    if (reviewData) {
      setCorrectedObjects(
        reviewData.detections.map((detection) => detection.label),
      );

      setCorrectedDescription(reviewData.aiDescription);
    }
  }, [reviewData]);

  const [newObject, setNewObject] = useState("");

  const [approved, setApproved] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);

  function handleExportJSON() {
    const exportData = {
      media_id: reviewData?.mediaId ?? "",
      media_url: reviewData?.mediaUrl ?? "",

      ai_objects: aiObjects,

      final_objects: correctedObjects,

      ai_description: aiDescription,

      final_description: correctedDescription,

      approved,

      quality_evaluation: evaluation
        ? {
            description_score: evaluation.description_score,
            object_accuracy: evaluation.object_accuracy,
            review_score: evaluation.review_score,
            overall_quality_score: evaluation.overall_quality_score,
            status: evaluation.status,
          }
        : null,

      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `visionlabel-${reviewData?.mediaId ?? "review"}.json`;

    link.click();

    URL.revokeObjectURL(url);
  }

  function handleExportCSV() {
    const row = {
      media_id: reviewData?.mediaId ?? "",
      media_url: reviewData?.mediaUrl ?? "",
      ai_objects: aiObjects.join("; "),
      final_objects: correctedObjects.join("; "),
      ai_description: aiDescription,
      final_description: correctedDescription,
      approved,
      description_score: evaluation?.description_score ?? "",
      object_accuracy: evaluation?.object_accuracy ?? "",
      review_score: evaluation?.review_score ?? "",
      overall_quality_score: evaluation?.overall_quality_score ?? "",
      status: evaluation?.status ?? "",
    };

    const headers = Object.keys(row);

    const values = Object.values(row).map((value) => {
      const text = String(value);
      return `"${text.replace(/"/g, '""')}"`;
    });

    const csv = `${headers.join(",")}\n${values.join(",")}`;

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `visionlabel-${reviewData?.mediaId ?? "review"}.csv`;

    link.click();

    URL.revokeObjectURL(url);
  }

  async function handleExportCOCO() {
    if (!reviewData) {
      return;
    }

    const image = new Image();

    const imageUrl = reviewData.mediaUrl.startsWith("http")
      ? reviewData.mediaUrl
      : `http://127.0.0.1:8000${reviewData.mediaUrl}`;

    image.src = imageUrl;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error("Failed to load image for COCO export."));
    });

    const categoriesMap = new Map<string, number>();

    const allObjects = Array.from(new Set([...aiObjects, ...correctedObjects]));

    allObjects.forEach((label, index) => {
      categoriesMap.set(label, index + 1);
    });

    const categories = allObjects.map((label) => ({
      id: categoriesMap.get(label)!,
      name: label,
      supercategory: "object",
    }));

    const annotations = reviewData.detections.map((detection, index) => {
      const x = detection.bbox.x1;
      const y = detection.bbox.y1;
      const width = detection.bbox.x2 - detection.bbox.x1;
      const height = detection.bbox.y2 - detection.bbox.y1;

      return {
        id: index + 1,
        image_id: 1,
        category_id: categoriesMap.get(detection.label) ?? 0,
        bbox: [x, y, width, height],
        area: width * height,
        iscrowd: 0,
        confidence: detection.confidence,
      };
    });

    const cocoData = {
      info: {
        description: "VisionLabel AI reviewed dataset",
        version: "1.0",
      },

      images: [
        {
          id: 1,
          file_name: reviewData.mediaId,
          width: image.naturalWidth,
          height: image.naturalHeight,
        },
      ],

      annotations,

      categories,
    };

    const blob = new Blob([JSON.stringify(cocoData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `visionlabel-${reviewData.mediaId}-coco.json`;

    link.click();

    URL.revokeObjectURL(url);
  }

  async function handleSubmitReview() {
    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const result = await submitReview({
        media_id: reviewData?.mediaId ?? "",

        ai_description: aiDescription,

        corrected_description: correctedDescription,

        ai_objects: aiObjects,

        corrected_objects: correctedObjects,

        approved: approved,
      });

      const evaluationResult = await evaluateReview({
        media_id: reviewData?.mediaId ?? "",
        ai_description: aiDescription,
        human_description: correctedDescription,
        ai_objects: aiObjects,
        human_objects: correctedObjects,
      });

      setEvaluation(evaluationResult);

      console.log("Review submitted:", result);

      setSuccessMessage(
        `Review submitted successfully. Status: ${result.status}`,
      );
    } catch (error) {
      console.error("Review submission error:", error);

      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit review.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#EEE2D2] text-[#3D2B1F]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">VisionLabel AI</h1>

          <p className="text-xs text-[#8B6F59]">
            Human Review & Annotation Workspace
          </p>
        </div>

        {/* Main workspace */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Image section */}
          <section className="rounded-2xl border border-[#D8C6AE] bg-[#EEE2D2] p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Media Preview</h2>

              <p className="text-xs text-[#8B6F59]">AI-generated detections</p>
            </div>

            <div className="flex min-h-450 items-center justify-center rounded-xl border-[#D8C6AE] bg-[#EEE2D2] p-4">
              {reviewData?.mediaUrl ? (
                <div className="relative inline-block max-w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={reviewData.mediaUrl}
                    alt="Uploaded image"
                    onLoad={(event) => {
                      setImageSize({
                        width: event.currentTarget.naturalWidth,
                        height: event.currentTarget.naturalHeight,
                      });
                    }}
                    className="block max-h-600 max-w-full rounded-xl object-contain"
                  />

                  {reviewData.detections.map((detection, index) => {
                    const scaleX = 100 / imageSize.width;

                    const scaleY = 100 / imageSize.height;

                    const left = detection.bbox.x1 * scaleX;

                    const top = detection.bbox.y1 * scaleY;

                    const width =
                      (detection.bbox.x2 - detection.bbox.x1) * scaleX;

                    const height =
                      (detection.bbox.y2 - detection.bbox.y1) * scaleY;

                    return (
                      <div
                        key={`${detection.label}-${index}`}
                        className="absolute border-2 border-[#4A3326]"
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${width}%`,
                          height: `${height}%`,
                        }}
                      >
                        <span className="absolute -top-6 left-0 rounded bg-[#4A3326] px-2 py-1 text-xs font-medium text-white">
                          {detection.label}{" "}
                          {(detection.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-slate-500">
                  <div className="mb-3 text-5xl">🖼️</div>
                  <p>Image preview will appear here</p>
                </div>
              )}
            </div>
          </section>

          {/* Review section */}
          <section className="space-y-6">
            {/* Objects */}
            <div className="rounded-2xl border border-[#D8C6AE] bg-[#EEE2D2] p-5">
              <h2 className="text-lg font-semibold">Object Review</h2>

              <p className="mt-1 text-xs text-[#8B6F59]">
                Verify and correct AI-generated labels.
              </p>

              {/* AI Objects */}
              <div className="mt-5">
                <h3 className="mb-3 text-sm font-medium text-[#8B6F59]">
                  AI Detected Objects
                </h3>

                <div className="flex flex-wrap gap-2">
                  {aiObjects.map((object, index) => (
                    <span
                      key={`ai-object-${index}`}
                      className="rounded-lg bg-[#F4EBDD] px-3 py-2 text-sm text-[#3D2B1F]"
                    >
                      {object}
                    </span>
                  ))}
                </div>
              </div>

              {/* Human Objects */}
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium text-[#8B6F59]">
                  Human Verified Objects
                </h3>

                <div className="space-y-2">
                  {correctedObjects.map((object, index) => (
                    <div
                      key={`corrected-object-${index}`}
                      className="flex items-center justify-between rounded-lg bg-[#F8F1E7] px-3 py-2"
                    >
                      <span>{object}</span>

                      <button
                        onClick={() =>
                          setCorrectedObjects(
                            correctedObjects.filter((item) => item !== object),
                          )
                        }
                        className="text-sm text-[#8B6F59] hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newObject}
                    onChange={(event) => setNewObject(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();

                        const value = newObject.trim();

                        if (!value || correctedObjects.includes(value)) {
                          return;
                        }

                        setCorrectedObjects([...correctedObjects, value]);
                        setNewObject("");
                      }
                    }}
                    placeholder="Add object label"
                    className="flex-1 rounded-lg border border-[#D8C6AE] bg-[#F8F1E7] px-3 py-2 text-sm text-[#3D2B1F] outline-none focus:[#F4EBDD] focus:border-[#F4EBDD] focus:ring-1 focus:ring-[#F4EBDD]"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const value = newObject.trim();

                      if (!value || correctedObjects.includes(value)) {
                        return;
                      }

                      setCorrectedObjects([...correctedObjects, value]);
                      setNewObject("");
                    }}
                    className="rounded-lg border-[#D8C6AE] bg-[#F8F1E7] px-4 py-2 text-sm font-medium text-[#3D2B1F] hover:bg-[#4A3326] hover:text-white"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-[#D8C6AE] bg-[#EEE2D2] p-5">
              <h2 className="text-lg font-semibold">Description Review</h2>

              <p className="mt-1 text-xs text-[#8B6F59]">
                Compare and correct the AI-generated description.
              </p>

              {/* AI description */}
              <div className="mt-5">
                <label className="mb-2 block text-xs text-[#8B6F59]">
                  AI Description
                </label>

                <textarea
                  value={aiDescription}
                  readOnly
                  className="min-h-100 w-full resize-none rounded-xl border border-[#D8C6AE] bg-[#F8F1E7] p-3 text-sm text-[#3D2B1F]   outline-none"
                />
              </div>

              {/* Human description */}
              <div className="mt-4">
                <label className="mb-2 block text-xs text-[#8B6F59] ">
                  Corrected Description
                </label>

                <textarea
                  value={correctedDescription}
                  onChange={(event) =>
                    setCorrectedDescription(event.target.value)
                  }
                  className="min-h-120 w-full resize-none rounded-xl border border-[#D8C6AE] bg-[#F8F1E7] p-3 text-sm text-[#3D2B1F] outline-none focus:border-[#8B6F59]"
                />
              </div>
            </div>

            {/* Approval */}
            <div className="rounded-2xl border border-[#D8C6AE] bg-[#EEE2D2] p-5">
              <h2 className="text-lg font-semibold">Review Decision</h2>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setApproved(true)}
                  className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
                    approved
                      ? " bg-[#3D2B1F] text-[#F8F1E7]"
                      : "bg-[#F8F1E7] text-[#3D2B1F] hover:bg-[#4A3326] hover:text-white"
                  }`}
                >
                  ✓ Approve
                </button>

                <button
                  onClick={() => setApproved(false)}
                  className={`rounded-xl border border-[#D8C6AE] px-5 py-3 text-sm font-medium transition ${
                    !approved
                      ? " bg-[#3D2B1F] text-[#F8F1E7]"
                      : "bg-[#F8F1E7] text-[#3D2B1F] hover:bg-[#4A3326] hover:text-white"
                  }`}
                >
                  ✕ Needs Correction
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="w-full rounded-xl border border-[#D8C6AE] bg-[#F8F1E7] px-5 py-4 font-semibold text-[#4A3326] transition hover:bg-[#EEE2D2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting Review..." : "Submit Review"}
            </button>

            <button
              onClick={handleExportJSON}
              disabled={!reviewData}
              className="w-full rounded-xl border border-[#D8C6AE] bg-[#F8F1E7] px-5 py-4 font-semibold text-[#4A3326] transition hover:bg-[#EEE2D2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export Reviewed Data (JSON)
            </button>

            <button
              onClick={handleExportCSV}
              disabled={!reviewData}
              className="w-full rounded-xl border border-[#D8C6AE] bg-[#F8F1E7] px-5 py-4 font-semibold text-[#4A3326] transition hover:bg-[#EEE2D2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export Reviewed Data (CSV)
            </button>

            <button
              onClick={handleExportCOCO}
              disabled={!reviewData}
              className="w-full rounded-xl border border-[#D8C6AE] bg-[#F8F1E7] px-5 py-4 font-semibold text-[#4A3326] transition hover:bg-[#EEE2D2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export COCO Dataset
            </button>

            {successMessage && (
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
                ✓ {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                ✕ {errorMessage}
              </div>
            )}

            {evaluation && (
              <div className="rounded-2xl border border-[#D8C6AE] bg-[#EEE2D2] p-5">
                <h2 className="text-lg font-semibold">Quality Evaluation</h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#F8F1E7] p-4">
                    <p className="text-xs text-[#8B6F59]">Description Score</p>
                    <p className="mt-1 text-2xl font-bold">
                      {evaluation.description_score}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#F8F1E7]  p-4">
                    <p className="text-xs text-[#8B6F59]">Object Accuracy</p>
                    <p className="mt-1 text-2xl font-bold">
                      {evaluation.object_accuracy}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#F8F1E7] p-4">
                    <p className="text-xs text-[#8B6F59]">Review Score</p>
                    <p className="mt-1 text-2xl font-bold">
                      {evaluation.review_score}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#F8F1E7]  p-4">
                    <p className="text-xs text-[#8B6F59]">Overall Quality</p>
                    <p className="mt-1 text-3xl font-bold">
                      {evaluation.overall_quality_score}%
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-[#8B6F59]">
                  Status:{" "}
                  <span className="font-medium text-white">
                    {evaluation.status}
                  </span>
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
