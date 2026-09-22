import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getBlueprintById } from "@/lib/db/blueprints";
import { AIFallbackBadge } from "@/components/ui/AIFallbackBadge";
import BlueprintGraph from "./BlueprintGraph";

type Props = { params: Promise<{ blueprintId: string }> };

export default async function BlueprintPage({ params }: Props) {
  const { blueprintId } = await params;
  const user = await requireUser();
  const result = await getBlueprintById(blueprintId, user.id);
  if (!result) notFound();

  const { blueprint, completed } = result;
  const { graph } = blueprint;
  const nodeByKey = new Map(graph.nodes.map((n) => [n.key, n]));

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/build"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[#9c9fa5] transition-colors hover:text-[#111111]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M9 2L4 7l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to project ideas
        </Link>

        {/* Header */}
        <div className="mb-6 rounded-[16px] border border-[#d3cec6] bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">
                Project blueprint
              </p>
              <h1 className="mt-1 text-[28px] font-medium leading-tight tracking-[-0.5px] text-[#111111]">
                {blueprint.title}
              </h1>
              {blueprint.tagline && (
                <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[#626260]">
                  {blueprint.tagline}
                </p>
              )}
            </div>
            {blueprint.used_fallback && <AIFallbackBadge compact label="Fallback" />}
          </div>

          {graph.uniqueAngle && (
            <p className="mt-4 rounded-[10px] border border-[#ff5600]/25 bg-[#ff5600]/[0.05] px-4 py-3 text-[12.5px] leading-relaxed text-[#111111]">
              <span className="font-semibold">Why this is not generic: </span>
              {graph.uniqueAngle}
            </p>
          )}

          {/* Input echo */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#f5f1ec] pt-4">
            {Object.entries(blueprint.inputs ?? {})
              .filter(([, v]) => typeof v === "string" && v.trim())
              .map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-full border border-[#e2ddd5] bg-[#faf8f4] px-2.5 py-1 text-[10.5px] text-[#8a8d93]"
                >
                  {String(v)}
                </span>
              ))}
          </div>
        </div>

        {/* The graph */}
        <BlueprintGraph blueprintId={blueprint.id} graph={graph} completed={completed} />

        {/* Phases */}
        {graph.phases.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-[#9c9fa5]">
              Build order
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {graph.phases.map((p, i) => (
                <div
                  key={p.title}
                  className="rounded-[14px] border border-[#d3cec6] bg-white p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#111111] text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="text-[13.5px] font-semibold text-[#111111]">{p.title}</p>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#626260]">{p.goal}</p>
                  <ul className="mt-3 space-y-1">
                    {p.nodes.map((k) => (
                      <li key={k} className="flex items-start gap-1.5 text-[11.5px] text-[#8a8d93]">
                        <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[#d3cec6]" />
                        {nodeByKey.get(k)?.label ?? k}
                      </li>
                    ))}
                  </ul>
                  {p.demo && (
                    <p className="mt-3 rounded-[8px] bg-[#faf8f4] px-2.5 py-2 text-[11px] leading-relaxed text-[#626260]">
                      <span className="font-semibold text-[#111111]">Demo: </span>
                      {p.demo}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Approaches */}
        {graph.approaches.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-[#9c9fa5]">
              How to build it efficiently
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {graph.approaches.map((a) => (
                <div
                  key={a.title}
                  className="rounded-[14px] border border-[#d3cec6] bg-white p-4"
                >
                  <p className="text-[13.5px] font-semibold text-[#111111]">{a.title}</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#626260]">{a.body}</p>
                  {a.instead && (
                    <p className="mt-2.5 border-l-2 border-[#ff5600]/40 pl-2.5 text-[11.5px] leading-relaxed text-[#8a8d93]">
                      <span className="font-semibold text-[#ff5600]">Instead of: </span>
                      {a.instead}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stretch */}
        {graph.stretch.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-[#9c9fa5]">
              Once the core works
            </h2>
            <ul className="space-y-2 rounded-[14px] border border-[#d3cec6] bg-white p-4">
              {graph.stretch.map((s) => (
                <li key={s} className="flex items-start gap-2 text-[12.5px] text-[#626260]">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#ff5600]" />
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
