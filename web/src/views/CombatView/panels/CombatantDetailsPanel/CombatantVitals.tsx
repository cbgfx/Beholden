export function CombatantVitals({
  vitals,
}: {
  vitals: {
    ac: number | null;
    acDetails?: string;
    hpCurrent: number | null;
    hpMax: number | null;
    hpDetails?: string;
  };
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div>
        AC: {vitals.ac ?? "—"}{" "}
        {vitals.acDetails && <span>({vitals.acDetails})</span>}
      </div>
      <div>
        HP:{" "}
        {vitals.hpCurrent !== null && vitals.hpMax !== null
          ? `${vitals.hpCurrent} / ${vitals.hpMax}`
          : "—"}{" "}
        {vitals.hpDetails && <span>({vitals.hpDetails})</span>}
      </div>
    </div>
  );
}
