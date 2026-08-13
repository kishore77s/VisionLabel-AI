"use client";

import { useEffect, useState } from "react";
import {
  getDashboardStats,
  type DashboardStats,
} from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#EEE2D2] p-8 text-[#3D2B1F]">
        <h1 className="text-3xl font-bold">
          VisionLabel AI Dashboard
        </h1>

        <p className="mt-4">
          Loading statistics...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#EEE2D2] p-8 text-[#3D2B1F]">
        <h1 className="text-3xl font-bold">
          VisionLabel AI Dashboard
        </h1>

        <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!stats) {
    return null;
  }

  const reviewPercentage =
    stats.total_images > 0
      ? (stats.reviewed / stats.total_images) * 100
      : 0;

  return (
    <main className="min-h-screen bg-[#EEE2D2] text-[#3D2B1F]">
      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            VisionLabel AI Dashboard
          </h1>

          <p className="mt-1 text-sm text-[#8B6F59]">
            Annotation and evaluation project statistics
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-2xl border border-[#D8C6AE] bg-[#F8F1E7] p-6">
            <p className="text-sm text-[#8B6F59]">
              Total Images
            </p>

            <p className="mt-2 text-4xl font-bold">
              {stats.total_images}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D8C6AE] bg-[#F8F1E7] p-6">
            <p className="text-sm text-[#8B6F59]">
              Pending Review
            </p>

            <p className="mt-2 text-4xl font-bold">
              {stats.pending_review}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D8C6AE] bg-[#F8F1E7] p-6">
            <p className="text-sm text-[#8B6F59]">
              Reviewed
            </p>

            <p className="mt-2 text-4xl font-bold">
              {stats.reviewed}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D8C6AE] bg-[#F8F1E7] p-6">
            <p className="text-sm text-[#8B6F59]">
              Objects Detected
            </p>

            <p className="mt-2 text-4xl font-bold">
              {stats.total_objects}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D8C6AE] bg-[#F8F1E7] p-6">
            <p className="text-sm text-[#8B6F59]">
              Average Confidence
            </p>

            <p className="mt-2 text-4xl font-bold">
              {(stats.average_confidence * 100).toFixed(1)}%
            </p>
          </div>

          <div className="rounded-2xl border border-[#D8C6AE] bg-[#F8F1E7] p-6">
            <p className="text-sm text-[#8B6F59]">
              Average Quality
            </p>

            <p className="mt-2 text-4xl font-bold">
              {stats.average_quality_score.toFixed(1)}%
            </p>
          </div>

        </div>

        <div className="mt-6 rounded-2xl border border-[#D8C6AE] bg-[#F8F1E7] p-6">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Review Progress
              </h2>

              <p className="mt-1 text-sm text-[#8B6F59]">
                {stats.reviewed} of {stats.total_images} images reviewed
              </p>
            </div>

            <p className="text-2xl font-bold">
              {reviewPercentage.toFixed(0)}%
            </p>
          </div>

          <div className="mt-5 h-4 overflow-hidden rounded-full bg-[#D8C6AE]">
            <div
              className="h-full rounded-full bg-[#3D2B1F]"
              style={{
                width: `${reviewPercentage}%`,
              }}
            />
          </div>

        </div>

      </div>
    </main>
  );
}