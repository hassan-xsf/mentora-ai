import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getAssessment } from "@/lib/db/careers";
import { AILabel } from "@/components/ui/AILabel";
import { AIFallbackBadge } from "@/components/ui/AIFallbackBadge";
import { AIFeedback } from "@/components/ai/AIFeedback";
import {
  DIMENSION_LABELS,
  matchCareer,
  rankedDimensions,
  type Dimension,
  type SkillProfile,
} from "@/lib/assessment/profile";
import CareerResultsClient from "../CareerResultsClient";
import SkillRadar from "../SkillRadar";

// Roadmap generation (AI + retry + link checks) is triggered from this page.
// Two 110s AI attempts + link checks must fit, or a killed function keeps the charge.
export const maxDuration = 300;

type Props = { params: Promise<{ assessmentId: string }> };

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Karachi",
});

const quoteList = (xs: string[]) => xs.map((x) => `“${x}”`).join(" and ");

/** Plain-language reason for one dimension's score, citing the answers behind it. */
function explain(profile: SkillProfile, d: Dimension): string {
  const ev = profile.evidence[d];
  const pos = ev.filter((e) => e.weight > 0).slice(0, 2).map((e) => e.answer);
  const neg = ev.filter((e) => e.weight < 0).slice(0, 2).map((e) => e.answer);
  const parts: string[] = [];
  if (pos.length) parts.push(`you chose ${quoteList(pos)}`);
  if (neg.length) parts.push(`you said ${quoteList(neg)} would drain you`);
  if (!parts.length) return "none of your answers pointed here.";
  return parts.join(", but ") + ".";
}

export default async function AssessmentResultPage({ params }: Props) {
  const { assessmentId } = await params;
  const user = await requireUser();
  // Ownership enforced in the query (and by RLS); never calls the AI.
  const assessment = await getAssessment(assessmentId, user.id);
  if (!assessment) notFound();

  const profile = assessment.skill_profile;
  const ranked = rankedDimensions(profile);
  const [top1, top2] = ranked;
  const lowest = ranked[ranked.length - 1];
  const label = (d: Dimension) => DIMENSION_LABELS[d].toLowerCase();
  const { hours_per_week, timeline, experience } = profile.constraints;

  const careers = assessment.suggestions.map((c) => {
    const m = matchCareer(c.title, profile);
    return { ...c, matched: m.matched.map(label), weaker: m.weaker.map(label) };
  });

  return (
    <div className="min-h-full bg-[#f5f1ec] antialiased">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-12">
        {/* Profile column */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:col-span-4 lg:self-start">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#ff5600]">Career Discovery</p>
            <h1 className="mt-1 text-[32px] font-medium leading-[1.1] tracking-[-0.8px] text-[#111111]">
              Your career matches
            </h1>
            <p className="mt-2 text-[13px] text-[#9c9fa5]">
              Saved {dateFmt.format(new Date(assessment.created_at))}
            </p>
          </div>

          <section className="rounded-[12px] border border-[#d3cec6] bg-white p-5">
            <h2 className="text-[15px] font-medium text-[#111111]">Your skill profile</h2>
            <p className="mt-1 text-[12px] text-[#9c9fa5]">
              Calculated directly from your answers, no AI involved. The same profile was given to the AI.
            </p>
            <div className="my-4 flex justify-center">
              <SkillRadar scores={profile.scores} />
            </div>
            <div className="space-y-2.5 text-[13px] leading-relaxed text-[#626260]">
              <p>
                <span className="font-medium text-[#111111]">
                  Strongest: {DIMENSION_LABELS[top1]} ({profile.scores[top1]}) and {DIMENSION_LABELS[top2]} ({profile.scores[top2]}).
                </span>{" "}
                {DIMENSION_LABELS[top1]} is high because {explain(profile, top1)}
              </p>
              <p>
                <span className="font-medium text-[#111111]">
                  Weakest: {DIMENSION_LABELS[lowest]} ({profile.scores[lowest]}).
                </span>{" "}
                It is low because {explain(profile, lowest)}
              </p>
            </div>

            {(hours_per_week || timeline || experience) && (
              <dl className="mt-4 space-y-1.5 border-t border-[#ebe7e1] pt-4 text-[12px]">
                {hours_per_week && (
                  <div className="flex gap-2"><dt className="w-20 shrink-0 text-[#9c9fa5]">Study time</dt><dd className="text-[#111111]">{hours_per_week}</dd></div>
                )}
                {timeline && (
                  <div className="flex gap-2"><dt className="w-20 shrink-0 text-[#9c9fa5]">Job-ready</dt><dd className="text-[#111111]">{timeline}</dd></div>
                )}
                {experience && (
                  <div className="flex gap-2"><dt className="w-20 shrink-0 text-[#9c9fa5]">Built so far</dt><dd className="text-[#111111]">{experience}</dd></div>
                )}
              </dl>
            )}
          </section>

          <Link
            href="/assessment"
            className="inline-flex h-10 items-center rounded-[8px] border border-[#d3cec6] bg-white px-4 text-[13px] font-medium text-[#111111] transition-colors hover:border-[#111111]"
          >
            Retake assessment
          </Link>
        </aside>

        {/* Careers column */}
        <main className="space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] text-[#626260]">Pick a career to generate a step-by-step roadmap.</p>
            {!assessment.used_fallback && <AILabel />}
          </div>
          {assessment.used_fallback && (
            <AIFallbackBadge label="Generic career suggestions — you were not charged" />
          )}
          <CareerResultsClient suggestions={careers} />
          {!assessment.used_fallback && (
            <div className="rounded-[12px] border border-[#d3cec6] bg-white px-5 py-4">
              <p className="mb-2 text-[13px] text-[#626260]">Were these suggestions useful?</p>
              <AIFeedback feature="career_suggestions" targetId={assessment.id} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
