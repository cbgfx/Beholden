import * as React from "react";
import ReactDOM from "react-dom";
import { theme } from "@/app/theme/theme";

type OptionItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

function extractOptions(children: React.ReactNode): OptionItem[] {
  const nodes = React.Children.toArray(children) as any[];
  const out: OptionItem[] = [];

  for (const n of nodes) {
    if (!React.isValidElement(n)) continue;

    // <option>
    if ((n.type as any) === "option") {
      const value = String((n.props as any).value ?? "");
      const label = String((n.props as any).children ?? "");
      const disabled = Boolean((n.props as any).disabled);
      out.push({ value, label, disabled });
      continue;
    }

    // <optgroup> (optional)
    if ((n.type as any) === "optgroup") {
      const groupChildren = React.Children.toArray((n.props as any).children) as any[];
      for (const gc of groupChildren) {
        if (!React.isValidElement(gc)) continue;
        if ((gc.type as any) !== "option") continue;
        const value = String((gc.props as any).value ?? "");
        const label = String((gc.props as any).children ?? "");
        const disabled = Boolean((gc.props as any).disabled);
        out.push({ value, label, disabled });
      }
    }
  }

  return out;
}

function menuSolidBg() {
  // theme.colors.panelBg is intentionally translucent for panels, but dropdown menus must be opaque.
  // Derive an opaque menu bg from the app bg color.
  const bg = theme.colors.bg; // e.g. #2e4057
  return bg;
}

type MenuPos = { top: number; left: number; width: number };

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { children, value, defaultValue, onChange, disabled, style, title, ...rest } = props;

  const options = React.useMemo(() => extractOptions(children), [children]);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<string>(String(defaultValue ?? options[0]?.value ?? ""));
  const selectedValue = String(isControlled ? value : internalValue);

  const selectedLabel =
    options.find((o) => o.value === selectedValue)?.label ??
    options[0]?.label ??
    "";

  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const [menuPos, setMenuPos] = React.useState<MenuPos>({ top: 0, left: 0, width: 0 });

  const recomputePos = React.useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width
    });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    recomputePos();

    const onResize = () => recomputePos();
    // capture scroll from any scrollable parent
    const onScroll = () => recomputePos();

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, recomputePos]);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const commitValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onChange?.({
        target: { value: next },
        currentTarget: { value: next }
      } as any);
    },
    [isControlled, onChange]
  );

  const bgSolid = menuSolidBg();

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        minWidth: 140,
        ...(style ?? {})
      }}
      title={title}
    >
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: theme.radius.control,
          border: `2px solid ${theme.colors.accent}`,
          background: theme.colors.inputBg,
          color: theme.colors.text,
          fontWeight: 800,
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          opacity: disabled ? 0.55 : 1
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedLabel || "Select…"}
        </span>
        <span style={{ opacity: 0.85, fontWeight: 900 }}>▾</span>
      </button>

      {/* Menu (portal to avoid modal stacking/opacity/overflow issues) */}
      {open && !disabled
        ? ReactDOM.createPortal(
            <div
              style={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
                width: menuPos.width,
                zIndex: 999999,
                borderRadius: theme.radius.control,
                border: `2px solid ${theme.colors.accent}`,
                background: bgSolid,
                boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                overflow: "hidden",
                maxHeight: 280
              }}
            >
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {options.map((o) => {
                  const isSel = o.value === selectedValue;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      disabled={o.disabled}
                      onClick={() => {
                        if (o.disabled) return;
                        commitValue(o.value);
                        setOpen(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        border: "none",
                        background: isSel ? theme.colors.accent : bgSolid,
                        color: isSel ? "#000" : theme.colors.text,
                        fontWeight: isSel ? 900 : 700,
                        cursor: o.disabled ? "not-allowed" : "pointer",
                        opacity: o.disabled ? 0.45 : 1
                      }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}

      {/* Hidden native select for form semantics/compat */}
      <select
        {...rest}
        value={selectedValue}
        onChange={(e) => commitValue(e.target.value)}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          width: 1,
          height: 1
        }}
      >
        {children}
      </select>
    </div>
  );
}
