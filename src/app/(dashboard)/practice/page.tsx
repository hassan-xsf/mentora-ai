import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getChallengeHistory } from "@/lib/db/practice";
import PracticeSetup from "./PracticeSetup";

// generateChallenge = AI call + running the reference solution on every test.
export const maxDuration = 120;

const DIFF_CLS = {
  easy: "text-[#047a2b]",
  medium: "text-[#b83d00]",
  hard: "text-[#c41c1c]",
};

export default async function PracticePage() {
  const user = await requireUser();
  const history = await getChallengeHistory(user.id);

  return (
    <div className="min-h-screen bg-[#f5f1ec] font-sans text-[#111111]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <PracticeSetup />

        {history.length > 0 && (
          <section className="mt-10 rounded-2xl border border-[#d3cec6] bg-white p-6 sm:p-8">
            <h2 className="text-[18px] font-medium tracking-[-0.2px]">Your challenges</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#ebe7e1] text-[11px] uppercase tracking-widest text-[#9c9fa5]">
                    <th className="py-2 pr-3 font-medium">Challenge</th>
                    <th className="py-2 pr-3 font-medium">Language</th>
                    <th className="py-2 pr-3 font-medium">Attempts</th>
                    <th className="py-2 pr-3 font-medium">Best</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((c) => (
                    <tr key={c.id} className="border-b border-[#f5f1ec] last:border-0">
                      <td className="py-2.5 pr-3">
                        <Link href={`/practice/challenge/${c.id}`} className="font-medium text-[#111111] hover:text-[#ff5600]">
                          {c.title || `${c.topic} challenge`}
                        </Link>
                        <span className={`ml-2 text-[11px] font-medium ${DIFF_CLS[c.difficulty] ?? ""}`}>
                          {c.difficulty}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-[#626260]">{c.language}</td>
                      <td className="py-2.5 pr-3 text-[#626260]">{c.attempts}</td>
                      <td className="py-2.5 pr-3 text-[#626260]">
                        {c.best_correctness == null ? "—" : `${c.best_correctness}%`}
                      </td>
                      <td className="py-2.5">
                        {c.first_passed_at ? (
                          <span className="rounded-full border border-[#0bdf50]/40 bg-[#0bdf50]/10 px-2 py-0.5 text-[11px] font-medium text-[#047a2b]">
                            Passed · +{c.xp_awarded} XP
                          </span>
                        ) : (
                          <span className="rounded-full border border-[#d3cec6] bg-[#f5f1ec] px-2 py-0.5 text-[11px] font-medium text-[#626260]">
                            {c.attempts ? "In progress" : "Not started"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
