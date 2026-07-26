// Loader Component - Gaming Style
export default function Loader({ size = "medium", color = "#6366f1" }) {
  const sizes = {
    small: "20px",
    medium: "40px",
    large: "60px",
  };

  const loaderStyle = {
    width: sizes[size] || sizes.medium,
    height: sizes[size] || sizes.medium,
    border: `4px solid ${color}20`,
    borderTop: `4px solid ${color}`,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={loaderStyle}></div>
    </div>
  );
}
