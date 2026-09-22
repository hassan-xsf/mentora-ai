"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { layoutGraph, CARD_W, CARD_H, type Placed } from "@/lib/blueprints/layout";
import {
  KIND_COLORS,
  KIND_LABELS,
  type BlueprintGraph as Graph,
  type BlueprintKind,
} from "@/lib/blueprints/types";
import { toggleBlueprintNode } from "@/app/actions/toggle-blueprint-node";

type Props = {
  blueprintId: string;
  graph: Graph;
  completed: string[];
};

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.6;

export default function BlueprintGraph({ blueprintId, graph, completed }: Props) {
  const layout = useMemo(() => layoutGraph(graph), [graph]);
  const [done, setDone] = useState<Set<string>>(() => new Set(completed));
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<Placed | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [, startTransition] = useTransition();
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // Direct neighbours of the hovered/selected node. Everything else dims, which
  // is the whole reason the graph stays readable at 14 nodes.
  const focus = hover ?? selected?.key ?? null;
  const related = useMemo(() => {
    if (!focus) return null;
    const set = new Set<string>([focus]);
    for (const e of layout.edges) {
      if (e.from === focus) set.add(e.to);
      if (e.to === focus) set.add(e.from);
    }
    return set;
  }, [focus, layout.edges]);

  function toggle(key: string) {
    const next = new Set(done);
    const isDone = !next.has(key);
    if (isDone) next.add(key);
    else next.delete(key);
    setDone(next);
    startTransition(() => {
      toggleBlueprintNode(blueprintId, key, isDone).catch(() => undefined);
    });
  }

  function onPointerDown(e: React.PointerEvent) {
    // Only the background pans; clicks on a card must still select it.
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) });
  }

  function reset() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  const progress =
    layout.nodes.length === 0
      ? 0
      : Math.round((done.size / layout.nodes.length) * 100);

  const kindsPresent = Array.from(
    new Set(layout.nodes.map((n) => n.kind))
  ) as BlueprintKind[];

  return (
    <div className="rounded-[16px] border border-[#d3cec6] bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-[#f0ece5] px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
          {kindsPresent.map((k) => (
            <span
              key={k}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#626260]"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: KIND_COLORS[k] }}
              />
              {KIND_LABELS[k]}
            </span>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11.5px] font-medium text-[#9c9fa5]">
            {done.size}/{layout.nodes.length} done
          </span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#f0ece5]">
            <div
              className="h-1.5 rounded-full bg-[#0bdf50] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="ml-1 flex items-center gap-0.5 rounded-[8px] border border-[#d3cec6] p-0.5">
            <ZoomBtn
              label="Zoom out"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.15).toFixed(2)))}
            >
              −
            </ZoomBtn>
            <button
              type="button"
              onClick={reset}
              className="px-2 text-[11px] font-medium text-[#626260] hover:text-[#111111]"
            >
              {Math.round(zoom * 100)}%
            </button>
            <ZoomBtn
              label="Zoom in"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.15).toFixed(2)))}
            >
              +
            </ZoomBtn>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative cursor-grab overflow-hidden bg-[#faf8f4] active:cursor-grabbing [background-image:radial-gradient(#e2ddd5_1px,transparent_1px)] [background-size:22px_22px]"
        style={{ height: Math.min(layout.height + 80, 620) }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <div
          className="absolute left-0 top-0 origin-top-left transition-transform duration-150"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* Edges */}
          <svg
            className="pointer-events-none absolute inset-0"
            width={layout.width}
            height={layout.height}
            aria-hidden
          >
            <defs>
              {kindsPresent.map((k) => (
                <marker
                  key={k}
                  id={`arrow-${k}`}
                  viewBox="0 0 8 8"
                  refX="7"
                  refY="4"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M0 0 L8 4 L0 8 z" fill={KIND_COLORS[k]} />
                </marker>
              ))}
            </defs>

            {layout.edges.map((e, i) => {
              const color = KIND_COLORS[e.from_.kind];
              const isRelated = !related || (related.has(e.from) && related.has(e.to));
              const bothDone = done.has(e.from) && done.has(e.to);
              return (
                <g key={`${e.from}-${e.to}-${i}`} opacity={isRelated ? 1 : 0.12}>
                  <path
                    d={e.path}
                    fill="none"
                    stroke={bothDone ? "#0bdf50" : color}
                    strokeOpacity={e.soft ? 0.4 : 0.62}
                    strokeWidth={focus && isRelated ? 2.4 : 1.8}
                    strokeDasharray={e.soft ? "5 6" : undefined}
                    markerEnd={`url(#arrow-${e.from_.kind})`}
                    style={{ transition: "stroke-width 0.2s ease, stroke 0.3s ease" }}
                  />
                  {/* Flow pulse along the highlighted path. */}
                  {focus && isRelated && !e.soft && (
                    <circle r="3" fill={color}>
                      <animateMotion dur="1.6s" repeatCount="indefinite" path={e.path} />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Cards */}
          {layout.nodes.map((n) => {
            const isDone = done.has(n.key);
            const dim = related ? !related.has(n.key) : false;
            const color = KIND_COLORS[n.kind];
            return (
              <div
                key={n.key}
                data-node
                className="absolute"
                style={{
                  left: n.x,
                  top: n.y,
                  width: CARD_W,
                  height: CARD_H,
                  opacity: dim ? 0.3 : 1,
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={() => setHover(n.key)}
                onMouseLeave={() => setHover(null)}
              >
                <button
                  type="button"
                  onClick={() => setSelected(n)}
                  className={`group flex h-full w-full flex-col overflow-hidden rounded-[13px] border bg-white p-3 text-left shadow-[0_1px_2px_rgba(17,17,17,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(17,17,17,0.35)] ${
                    selected?.key === n.key ? "ring-2 ring-offset-1" : ""
                  }`}
                  style={{
                    borderColor: isDone ? "#0bdf50" : `${color}55`,
                    // The tint must sit on an OPAQUE base: this shorthand beats
                    // the bg-white class, and a translucent value would let the
                    // edges behind the card show through it.
                    background: isDone
                      ? "linear-gradient(135deg, rgba(11,223,80,0.10), rgba(11,223,80,0.02)), #ffffff"
                      : `linear-gradient(135deg, ${color}0d, #ffffff 60%), #ffffff`,
                    ...(selected?.key === n.key
                      ? ({ ["--tw-ring-color" as string]: color } as React.CSSProperties)
                      : {}),
                  }}
                >
                  {/* Kind stripe */}
                  <span
                    className="absolute left-0 top-3 h-[calc(100%-24px)] w-[3px] rounded-r"
                    style={{ background: isDone ? "#0bdf50" : color }}
                  />
                  <div className="flex shrink-0 items-start justify-between gap-2 pl-1.5">
                    <p
                      className={`line-clamp-2 text-[12.5px] font-semibold leading-tight ${
                        isDone ? "text-[#0a7d30] line-through decoration-[#0bdf50]/50" : "text-[#111111]"
                      }`}
                    >
                      {n.label}
                    </p>
                    <span
                      role="checkbox"
                      aria-checked={isDone}
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(n.key);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          toggle(n.key);
                        }
                      }}
                      className={`mt-px flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors ${
                        isDone
                          ? "border-[#0bdf50] bg-[#0bdf50] text-white"
                          : "border-[#d3cec6] bg-white hover:border-[#111111]"
                      }`}
                    >
                      {isDone && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden>
                          <path
                            d="M1 3l2 2 4-4"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 min-h-0 pl-1.5 text-[10.5px] leading-relaxed text-[#8a8d93]">
                    {n.detail}
                  </p>
                  <div className="mt-auto flex shrink-0 items-center gap-1.5 pt-1.5 pl-1.5">
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                      style={{ background: `${color}1a`, color }}
                    >
                      {KIND_LABELS[n.kind]}
                    </span>
                    {n.effort && (
                      <span className="text-[9.5px] font-medium text-[#9c9fa5]">{n.effort}</span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        <p className="pointer-events-none absolute bottom-2.5 left-4 text-[10.5px] text-[#b3ada3]">
          Drag to pan · click a step for the how-to
        </p>
      </div>

      {selected && (
        <NodeDetail node={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function ZoomBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[14px] font-medium text-[#626260] transition-colors hover:bg-[#f5f1ec] hover:text-[#111111]"
    >
      {children}
    </button>
  );
}

function NodeDetail({ node, onClose }: { node: Placed; onClose: () => void }) {
  const color = KIND_COLORS[node.kind];
  return (
    <div className="border-t border-[#f0ece5] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: `${color}1a`, color }}
          >
            {KIND_LABELS[node.kind]}
          </span>
          <h3 className="mt-2 text-[16px] font-semibold text-[#111111]">{node.label}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-[#626260]">{node.detail}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 rounded-[6px] px-2 py-1 text-[16px] leading-none text-[#9c9fa5] hover:bg-[#f5f1ec] hover:text-[#111111]"
        >
          ×
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {node.why && <DetailBox title="Why it matters" body={node.why} />}
        {node.approach && (
          <DetailBox title="Efficient approach" body={node.approach} accent={color} />
        )}
        {node.pitfall && <DetailBox title="Common pitfall" body={node.pitfall} accent="#ff5600" />}
      </div>
    </div>
  );
}

function DetailBox({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-[10px] border bg-[#faf8f4] p-3"
      style={{ borderColor: accent ? `${accent}33` : "#e2ddd5" }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: accent ?? "#9c9fa5" }}
      >
        {title}
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-[#626260]">{body}</p>
    </div>
  );
}
