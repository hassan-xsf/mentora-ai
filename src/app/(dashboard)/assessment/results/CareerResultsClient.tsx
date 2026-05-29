"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import type { CareerSuggestionResult } from "@/app/actions/career-suggestions";
import GenerateRoadmapButton from "./GenerateRoadmapButton";

const demandStyle: Record<string, string> = {
  High: "bg-[#0bdf50]/10 text-[#047a2b]",
  Medium: "bg-[#ff5600]/10 text-[#b83d00]",
  Low: "bg-[#ebe7e1] text-[#626260]",
};

function fitBar(score: number) {
  const color = score >= 80 ? "#0bdf50" : score >= 60 ? "#ff5600" : "#c41c1c";
  return { color };
}

type Props = {
  suggestions: CareerSuggestionResult[];
};

export default function CareerResultsClient({ suggestions }: Props) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {suggestions.map((career, idx) => {
        const { color } = fitBar(career.fit_score);
        return (
          <motion.div
            key={idx}
            variants={fadeInUp}
            className="flex flex-col rounded-[12px] border border-[#d3cec6] bg-white p-6 transition-shadow hover:shadow-[0_2px_16px_rgba(17,17,17,0.06)]"
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 className="text-[15px] font-medium leading-snug tracking-[-0.2px] text-[#111111]">
                {career.title}
              </h2>
              <span
                className={`shrink-0 rounded-[4px] px-2 py-0.5 text-[11px] font-medium ${demandStyle[career.demand_indicator] ?? "bg-[#ebe7e1] text-[#626260]"}`}
              >
                {career.demand_indicator} demand
              </span>
            </div>

            {/* Fit score bar */}
            <div className="mb-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] text-[#9c9fa5]">Fit score</span>
                <span className="text-[13px] font-medium" style={{ color }}>
                  {career.fit_score}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ebe7e1]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${career.fit_score}%`, background: color }}
                />
              </div>
            </div>

            {/* Salary */}
            <p className="mb-3 text-[12px] text-[#9c9fa5]">
              ${career.salary_min.toLocaleString()} – ${career.salary_max.toLocaleString()}{" "}
              {career.salary_currency}/yr
            </p>

            {/* Description */}
            <p className="mb-4 flex-1 text-[13px] leading-relaxed text-[#626260]">
              {career.description}
            </p>

            {/* Why fit — tinted card */}
            <div className="mb-5 rounded-[8px] border border-[#d3cec6] bg-[#f5f1ec] p-3">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">
                Why this fits you
              </p>
              <p className="text-[12px] leading-relaxed text-[#626260]">
                {career.why_good_fit}
              </p>
            </div>

            <GenerateRoadmapButton
              careerTitle={career.title}
              careerDescription={career.description}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
