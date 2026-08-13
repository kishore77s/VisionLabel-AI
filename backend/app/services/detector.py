from ultralytics import YOLO


class ObjectDetector:

    def __init__(self):
        self.model = YOLO("yolo26n.pt")

    def detect(self, image_path: str):

        results = self.model.predict(
            source=image_path,
            conf=0.50
        )

        detections = []

        for result in results:

            boxes = result.boxes

            if boxes is None:
                continue

            for box in boxes:

                class_id = int(box.cls[0])
                confidence = float(box.conf[0])

                x1, y1, x2, y2 = box.xyxy[0].tolist()

                label = result.names[class_id]

                detections.append({
                    "label": label,
                    "confidence": round(confidence, 4),
                    "bbox": {
                        "x1": round(x1, 2),
                        "y1": round(y1, 2),
                        "x2": round(x2, 2),
                        "y2": round(y2, 2)
                    }
                })

        return detections
    
    
# Object detection service implementation
