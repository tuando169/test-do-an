// src/components/Tooltip.jsx
export default function Tooltip({ visible, x, y, title, alt }) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: y,
        left: x,
        background: "rgba(0,0,0,0.85)",
        color: "#fff",
        padding: "6px 12px",
        borderRadius: "4px",
        pointerEvents: "none",
        fontSize: "14px",
        zIndex: 9999,
        maxWidth: "250px",
        whiteSpace: "pre-wrap",
      }}
    >
      <div><strong>{title}</strong></div>
      <div>{alt}</div>
    </div>
  );
}
