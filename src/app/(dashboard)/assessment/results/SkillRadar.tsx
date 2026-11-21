import { DIMENSIONS, DIMENSION_LABELS, type Dimension } from "@/lib/assessment/profile";

const SIZE = 300;
const C = SIZE / 2;
const R = 92;

function point(i: number, r: number): [number, number] {
  const a = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

const poly = (rs: number[]) => rs.map((r, i) => point(i, r).map((n) => n.toFixed(1)).join(",")).join(" ");

/** Hand-drawn SVG radar of the 0–100 dimension scores. */
export default function SkillRadar({ scores }: { scores: Record<Dimension, number> }) {
  const values = DIMENSIONS.map((d) => (R * scores[d]) / 100);
  const summary = DIMENSIONS.map((d) => `${DIMENSION_LABELS[d]} ${scores[d]}`).join(", ");

  return (
    // Side padding in the viewBox leaves room for the longest axis label.
    <svg viewBox={`-40 0 ${SIZE + 80} ${SIZE}`} className="h-auto w-full max-w-[320px]" role="img" aria-label={`Skill profile: ${summary}`}>
      {[25, 50, 75, 100].map((pct) => (
        <polygon
          key={pct}
          points={poly(DIMENSIONS.map(() => (R * pct) / 100))}
          fill="none"
          stroke={pct === 100 ? "#d3cec6" : "#ebe7e1"}
          strokeWidth="1"
        />
      ))}
      {DIMENSIONS.map((d, i) => {
        const [x, y] = point(i, R);
        return <line key={d} x1={C} y1={C} x2={x} y2={y} stroke="#ebe7e1" strokeWidth="1" />;
      })}
      <polygon points={poly(values)} fill="#ff5600" fillOpacity="0.15" stroke="#ff5600" strokeWidth="2" strokeLinejoin="round" />
      {values.map((r, i) => {
        const [x, y] = point(i, r);
        return <circle key={DIMENSIONS[i]} cx={x} cy={y} r="3" fill="#ff5600" />;
      })}
      {DIMENSIONS.map((d, i) => {
        const [x, y] = point(i, R + 22);
        const anchor = Math.abs(x - C) < 4 ? "middle" : x > C ? "start" : "end";
        return (
          <text key={d} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize="10.5" fill="#626260">
            <tspan>{DIMENSION_LABELS[d].split(" & ")[0]}</tspan>
            <tspan x={x} dy="12" fontWeight="600" fill="#111111">{scores[d]}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
