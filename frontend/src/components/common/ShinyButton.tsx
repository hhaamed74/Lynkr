// ShinyButton.tsx
import React from "react";

interface ShinyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  width?: string;
  height?: string;
}

const ShinyButton: React.FC<ShinyButtonProps> = ({
  children,
  width = "120px",
  height = "50px",
  style,
  ...rest
}) => {
  return (
    <button
      {...rest}
      style={{
        width,
        height,
        borderRadius: "25px",
        border: "none",
        background: "linear-gradient(90deg, #00c8ff, #fff701)",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "1rem",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 15px rgba(0, 200, 255, 0.5)",
        position: "relative",
        overflow: "hidden",
        marginRight: "20px",
        ...style,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 6px 25px rgba(0, 200, 255, 0.7)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 200, 255, 0.5)")
      }
    >
      {children}
      <span
        style={{
          content: '""',
          position: "absolute",
          top: 0,
          left: "-70%",
          width: "50%",
          height: "100%",
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.4), rgba(255,255,255,0))",
          transform: "skewX(-20deg)",
          animation: "shine 2s infinite",
        }}
      />
    </button>
  );
};

export default ShinyButton;
