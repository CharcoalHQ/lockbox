export function MergeTimeline({
  layers,
}: {
  layers: { file: string; desc: string; highlight?: boolean }[];
}) {
  return (
    <div className="mb-8">
      {layers.map((layer, i) => {
        const isLast = i === layers.length - 1;
        const dotColor = layer.highlight || isLast ? "bg-accent" : "bg-fg-dim";

        return (
          <div key={layer.file} className="flex gap-4">
            {/* Line + dot column */}
            <div className="flex flex-col items-center w-4 shrink-0">
              <div
                className={`rounded-full shrink-0 ${
                  isLast ? "w-3.5 h-3.5" : "w-2.5 h-2.5"
                } ${dotColor} ring-4 ring-bg mt-1.5`}
              />
              {!isLast && (
                <div
                  className={`w-px flex-1 ${
                    layer.highlight ? "bg-accent/40" : "bg-border"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`font-mono text-sm ${
                  layer.highlight || isLast
                    ? "text-accent font-medium"
                    : "text-fg"
                }`}
              >
                {layer.file}
              </p>
              <p className="text-xs text-fg-dim">{layer.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
