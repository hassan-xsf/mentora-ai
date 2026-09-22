import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getBlueprintsByStudent } from "@/lib/db/blueprints";
import { CREDIT_COSTS } from "@/lib/credits/config";
import BlueprintForm from "./BlueprintForm";

export default async function BuildPage() {
  const user = await requireUser();
  const blueprints = await getBlueprintsByStudent(user.id);

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-8">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">
            What to create?
          </p>
          <h1 className="mt-1 text-[28px] font-medium leading-tight tracking-[-0.5px] text-[#111111]">
            Find a project worth building
          </h1>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[#626260]">
            Answer a few questions and get one specific project idea — no todo apps —
            laid out as a dependency graph you can build step by step, with the
            efficient approach for each part.
            <span className="ml-1 text-[#9c9fa5]">
              Costs {CREDIT_COSTS.generate_blueprint} credits.
            </span>
          </p>
        </div>

        <BlueprintForm />

        {blueprints.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-[#9c9fa5]">
              Your blueprints
            </h2>
            <div className="space-y-2">
              {blueprints.map((b) => (
                <Link
                  key={b.id}
                  href={`/build/${b.id}`}
                  className="flex items-center justify-between gap-4 rounded-[12px] border border-[#d3cec6] bg-white px-4 py-3.5 transition-colors hover:border-[#111111]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[#111111]">{b.title}</p>
                    <p className="truncate text-[12px] text-[#9c9fa5]">
                      {b.inputs?.stack} · {b.inputs?.time}
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] text-[#9c9fa5]">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
