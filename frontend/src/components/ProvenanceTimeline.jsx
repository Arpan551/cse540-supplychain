// frontend/src/components/ProvenanceTimeline.jsx
// Renders the on-chain provenance history as a vertical timeline.

const STATUS_COLORS = ["#6c757d", "#0d6efd", "#0dcaf0", "#198754", "#dc3545"];

export default function ProvenanceTimeline({ history, statusLabels }) {
  if (!history || history.length === 0) {
    return <p style={{ color: "#6c757d", fontSize: "0.875rem" }}>No history entries.</p>;
  }

  return (
    <ol style={{ listStyle: "none", padding: 0, margin: 0, position: "relative" }}>
      {history.map((entry, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            gap: 16,
            paddingBottom: i < history.length - 1 ? 20 : 0,
            position: "relative",
          }}
        >
          {/* Vertical line */}
          {i < history.length - 1 && (
            <div
              style={{
                position: "absolute",
                left: 11,
                top: 24,
                bottom: 0,
                width: 2,
                background: "#dee2e6",
              }}
            />
          )}

          {/* Dot */}
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: STATUS_COLORS[entry.statusAfter] || "#6c757d",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              zIndex: 1,
            }}
          >
            {i + 1}
          </div>

          {/* Content */}
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  background: STATUS_COLORS[entry.statusAfter] || "#6c757d",
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: 10,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                {statusLabels[entry.statusAfter]}
              </span>
              {entry.statusBefore !== entry.statusAfter && (
                <span style={{ fontSize: "0.75rem", color: "#6c757d" }}>
                  (was {statusLabels[entry.statusBefore]})
                </span>
              )}
            </div>
            <p style={{ margin: "4px 0 2px", fontSize: "0.875rem" }}>{entry.note}</p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#6c757d" }}>
              {entry.timestamp} · by{" "}
              <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                {entry.actor.slice(0, 8)}…{entry.actor.slice(-6)}
              </span>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
