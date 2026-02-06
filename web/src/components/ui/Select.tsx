
import React from "react";
import { theme } from "../../app/theme/theme";

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        padding: "8px 10px",
        borderRadius: theme.radius.control,
        border: `1px solid ${theme.colors.panelBorder}`,
        background: theme.colors.inputBg,
        color: theme.colors.text,
        outline: "none",
        ...(props.style ?? {})
      }}
    />
  );
}
