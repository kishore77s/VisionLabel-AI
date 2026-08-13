const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Detection {
  label: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface DetectionResponse {
  media_id: string;
  filename: string;
  stored_file: string;
  media_url: string;
  detections: Detection[];
}

export interface DescriptionResponse {
  description: string;
  model: string;
}

export async function uploadImage(file: File): Promise<DetectionResponse> {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/detection/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Image processing failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function generateDescription(
  file: File,
  detections: Detection[],
  mediaId: string,
): Promise<DescriptionResponse> {
  const formData = new FormData();

  formData.append("file", file);

  formData.append("detections", JSON.stringify(detections));
  
  formData.append("media_id", mediaId);

  const response = await fetch(`${API_BASE_URL}/api/description/generate`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Description generation failed: ${response.status} ${errorText}`,
    );
  }

  return response.json();
}

export interface ReviewRequest {
  media_id: string;
  ai_description: string;
  corrected_description: string;
  ai_objects: string[];
  corrected_objects: string[];
  approved: boolean;
}

export interface ReviewResponse {
  media_id: string;
  approved: boolean;
  final_description: string;
  ai_objects: string[];
  final_objects: string[];
  status: string;
}

export async function submitReview(
  data: ReviewRequest,
): Promise<ReviewResponse> {
  const response = await fetch(`${API_BASE_URL}/api/review/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Review submission failed: ${response.status} ${errorText}`,
    );
  }

  return response.json();
}

export interface EvaluationRequest {
  media_id: string;
  ai_description: string;
  human_description: string;
  ai_objects: string[];
  human_objects: string[];
}

export interface EvaluationResponse {
  description_score: number;
  object_accuracy: number;
  review_score: number;
  overall_quality_score: number;
  status: string;
}

export async function evaluateReview(
  data: EvaluationRequest,
): Promise<EvaluationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/evaluation/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Evaluation failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export interface DashboardStats {
  total_images: number;
  pending_review: number;
  reviewed: number;
  total_objects: number;
  average_confidence: number;
  average_quality_score: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(
    `${API_BASE_URL}/api/dashboard/stats`,
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Dashboard request failed: ${response.status} ${errorText}`,
    );
  }

  return response.json();
}