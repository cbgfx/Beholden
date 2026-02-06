import React from "react";
import { theme } from "../../app/theme/theme";

export function IconButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        width: 34,
        height: 34,
        borderRadius: theme.radius.control,
        border: `1px solid ${theme.colors.panelBorder}`,
        background: "#eca72c",
        color: "rgba(0,0,0)",
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...(props.style ?? {})
      }}
    />
  );
}
