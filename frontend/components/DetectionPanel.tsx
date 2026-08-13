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

interface DetectionPanelProps {
  detections: Detection[];
  isProcessing: boolean;
}

export default function DetectionPanel({
  detections,
  isProcessing,
}: DetectionPanelProps) {
  return (
    <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              Detected Objects
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              YOLO predictions
            </p>
          </div>

          <div className="flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-800 px-2 text-xs font-semibold">
            {detections.length}
          </div>
        </div>
      </div>

      <div className="p-4">
        {isProcessing ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-white" />

            <p className="mt-4 text-sm text-slate-400">
              Analyzing image...
            </p>

            <p className="mt-1 text-xs text-slate-600">
              YOLO is detecting objects
            </p>
          </div>
        ) : detections.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl">
              ◎
            </div>

            <p className="mt-4 text-sm font-medium text-slate-300">
              No detections yet
            </p>

            <p className="mx-auto mt-2 max-w-220 text-xs leading-5 text-slate-600">
              Click Detect Objects to analyze
              this image with YOLO.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {detections.map((detection, index) => {
              const percentage =
                detection.confidence * 100;

              return (
                <div
                  key={`${detection.label}-${index}`}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-400">
                        {index + 1}
                      </span>

                      <div>
                        <p className="font-medium capitalize">
                          {detection.label}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-600">
                          Object detected
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-semibold">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md bg-slate-900 p-2">
                      <p className="text-slate-600">
                        X1
                      </p>

                      <p className="mt-1 text-slate-400">
                        {detection.bbox.x1.toFixed(0)}
                      </p>
                    </div>

                    <div className="rounded-md bg-slate-900 p-2">
                      <p className="text-slate-600">
                        Y1
                      </p>

                      <p className="mt-1 text-slate-400">
                        {detection.bbox.y1.toFixed(0)}
                      </p>
                    </div>

                    <div className="rounded-md bg-slate-900 p-2">
                      <p className="text-slate-600">
                        X2
                      </p>

                      <p className="mt-1 text-slate-400">
                        {detection.bbox.x2.toFixed(0)}
                      </p>
                    </div>

                    <div className="rounded-md bg-slate-900 p-2">
                      <p className="text-slate-600">
                        Y2
                      </p>

                      <p className="mt-1 text-slate-400">
                        {detection.bbox.y2.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {detections.length > 0 && (
        <div className="border-t border-slate-800 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Total objects
            </span>

            <span className="font-semibold">
              {detections.length}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Avg. confidence
            </span>

            <span className="font-semibold">
              {(
                (detections.reduce(
                  (sum, detection) =>
                    sum + detection.confidence,
                  0
                ) /
                  detections.length) *
                100
              ).toFixed(1)}
              %
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}