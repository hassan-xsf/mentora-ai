// import { Suspense } from "react";
// import Link from "next/link";
// import { AILabel } from "@/components/ui/AILabel";
// import { AIFallbackBadge } from "@/components/ui/AIFallbackBadge";
// import { getCareerSuggestions } from "@/app/actions/career-suggestions";
// import type { AssessmentAnswer } from "@/types";
// import CareerResultsClient from "./CareerResultsClient";

// type Props = {
//   searchParams: Promise<{ answers?: string }>;
// };

// function SkeletonCard() {
//   return (
//     <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6 space-y-4">
//       <div className="flex items-start justify-between gap-2">
//         <div className="h-4 w-32 animate-pulse rounded-[4px] bg-[#ebe7e1]" />
//         <div className="h-4 w-16 animate-pulse rounded-[4px] bg-[#ebe7e1]" />
//       </div>
//       <div className="space-y-1.5">
//         <div className="h-1.5 w-full animate-pulse rounded-full bg-[#ebe7e1]" />
//         <div className="flex justify-between">
//           <div className="h-3 w-12 animate-pulse rounded bg-[#ebe7e1]" />
//           <div className="h-3 w-8 animate-pulse rounded bg-[#ebe7e1]" />
//         </div>
//       </div>
//       <div className="space-y-1.5">
//         <div className="h-3 w-full animate-pulse rounded bg-[#ebe7e1]" />
//         <div className="h-3 w-4/5 animate-pulse rounded bg-[#ebe7e1]" />
//         <div className="h-3 w-3/5 animate-pulse rounded bg-[#ebe7e1]" />
//       </div>
//       <div className="h-16 animate-pulse rounded-[8px] bg-[#f5f1ec]" />
//       <div className="h-10 animate-pulse rounded-[8px] bg-[#ebe7e1]" />
//     </div>
//   );
// }

// async function CareerResults({ answers }: { answers: AssessmentAnswer[] }) {
//   const { suggestions, usedFallback } = await getCareerSuggestions(answers);

//   if (suggestions.length === 0) {
//     return (
//       <div className="rounded-2xl border border-[#d3cec6] bg-white px-8 py-16 text-center">
//         <p className="text-[14px] text-[#626260]">
//           No career suggestions could be generated. Please try again.
//         </p>
//         <Link
//           href="/assessment"
//           className="mt-4 inline-flex h-10 items-center rounded-[8px] bg-[#111111] px-5 text-[13px] font-medium text-white hover:bg-black"
//         >
//           Retake assessment
//         </Link>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       {usedFallback && (
//         <AIFallbackBadge label="Generic career suggestions" />
//       )}
//       <CareerResultsClient suggestions={suggestions} />
//     </div>
//   );
// }

// export default async function AssessmentResultsPage({ searchParams }: Props) {
//   const params = await searchParams;
//   let answers: AssessmentAnswer[] = [];

//   if (params.answers) {
//     try {
//       answers = JSON.parse(params.answers) as AssessmentAnswer[];
//     } catch {
//       answers = [];
//     }
//   }

//   if (answers.length === 0) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-[#f5f1ec] p-6">
//         <div className="rounded-2xl border border-[#d3cec6] bg-white px-8 py-14 text-center max-w-sm w-full">
//           <h1 className="text-[20px] font-medium tracking-[-0.3px] text-[#111111]">
//             No assessment data
//           </h1>
//           <p className="mt-2 text-[14px] text-[#626260]">
//             Please complete the assessment first.
//           </p>
//           <Link
//             href="/assessment"
//             className="mt-5 inline-flex h-10 items-center rounded-[8px] bg-[#ff5600] px-5 text-[13px] font-medium text-white hover:bg-[#e04d00]"
//           >
//             Take Assessment →
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-full bg-[#f5f1ec]">
//       <div className="mx-auto max-w-5xl px-6 py-10">

//         {/* Header */}
//         <div className="mb-8 flex items-start justify-between gap-4">
//           <div>
//             <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">
//               Career Discovery
//             </p>
//             <h1 className="mt-1 text-[32px] font-medium leading-[1.15] tracking-[-0.8px] text-[#111111]">
//               Your Career Matches
//             </h1>
//             <p className="mt-2 text-[15px] text-[#626260]">
//               Based on your assessment answers — click any career to generate a personalised roadmap.
//             </p>
//           </div>
//           <AILabel />
//         </div>

//         <Suspense
//           fallback={
//             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//               {Array.from({ length: 5 }).map((_, i) => (
//                 <SkeletonCard key={i} />
//               ))}
//             </div>
//           }
//         >
//           <CareerResults answers={answers} />
//         </Suspense>
//       </div>
//     </div>
//   );
// }




import { Suspense } from "react";
import Link from "next/link";
import { AILabel } from "@/components/ui/AILabel";
import { AIFallbackBadge } from "@/components/ui/AIFallbackBadge";
import { getCareerSuggestions } from "@/app/actions/career-suggestions";
import type { AssessmentAnswer } from "@/types";
import CareerResultsClient from "./CareerResultsClient";

type Props = {
  searchParams: Promise<{ answers?: string; design?: string }>;
};

// ==========================================
// SHARED ICONS & COMPONENTS
// ==========================================

const Icons = {
  Target: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
  ),
  Activity: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
  ),
  Compass: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
  ),
  Briefcase: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
  ),
  Zap: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
  )
};

function SkeletonCard() {
  return (
    <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6 space-y-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-32 animate-pulse rounded-[4px] bg-[#ebe7e1]" />
        <div className="h-4 w-16 animate-pulse rounded-[4px] bg-[#ebe7e1]" />
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 w-full animate-pulse rounded-full bg-[#ebe7e1]" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full animate-pulse rounded bg-[#ebe7e1]" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-[#ebe7e1]" />
      </div>
      <div className="h-16 animate-pulse rounded-[8px] bg-[#f5f1ec]" />
      <div className="h-10 animate-pulse rounded-[8px] bg-[#ebe7e1]" />
    </div>
  );
}

async function CareerResults({ answers }: { answers: AssessmentAnswer[] }) {
  const { suggestions, usedFallback } = await getCareerSuggestions(answers);
  if (suggestions.length === 0) {
    return (
      <div className="rounded-2xl border border-[#d3cec6] bg-white px-8 py-16 text-center shadow-sm">
        <p className="text-[14px] text-[#626260]">No career suggestions generated. Please try again.</p>
        <Link href="/assessment" className="mt-4 inline-flex h-10 items-center rounded-[8px] bg-[#111111] px-5 text-[13px] text-white hover:bg-[#ff5600] transition-colors">Retake assessment</Link>
      </div>
    );
  }
  return (
    <div className="space-y-4 w-full">
      {usedFallback && <AIFallbackBadge label="Generic career suggestions" />}
      <CareerResultsClient suggestions={suggestions} />
    </div>
  );
}

function EmptyDataState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f1ec] p-6">
      <div className="rounded-2xl border border-[#d3cec6] bg-white px-8 py-14 text-center max-w-sm w-full shadow-sm">
        <h1 className="text-[20px] font-medium text-[#111111]">No assessment data</h1>
        <p className="mt-2 text-[14px] text-[#626260]">Complete the assessment first.</p>
        <Link href="/assessment" className="mt-5 inline-flex h-10 items-center rounded-[8px] bg-[#ff5600] px-5 text-[13px] text-white hover:bg-[#111111]">Take Assessment</Link>
      </div>
    </div>
  );
}

function DesignSwitcher({ currentDesign }: { currentDesign: string }) {
  return (
    <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-[#d3cec6] p-3 z-[100] flex gap-2 overflow-x-auto items-center shadow-sm">
      <span className="text-[11px] font-bold uppercase tracking-widest text-[#111111] ml-4 mr-4 whitespace-nowrap">Choose UI:</span>
      {Array.from({ length: 19 }).map((_, i) => {
        const num = (i + 1).toString();
        const isActive = currentDesign === num;
        return (
          <Link
            key={num}
            href={`?design=${num}`}
            scroll={false}
            className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold transition-all ${
              isActive 
                ? 'bg-[#ff5600] text-white shadow-md scale-105' 
                : 'bg-[#ebe7e1] text-[#626260] hover:bg-[#d3cec6] hover:text-[#111111]'
            }`}
          >
            Design {num}
          </Link>
        )
      })}
    </div>
  );
}

// ==========================================
// DESIGNS (1-19)
// ==========================================

function Design1({ answers }: any) {
  return (
    <div className="min-h-screen bg-[#f5f1ec] pt-24 pb-12 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col sm:flex-row justify-between border-b border-[#d3cec6] pb-8">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#ff5600] tracking-widest">Mentora Discovery</p>
            <h1 className="text-[36px] font-medium text-[#111111] mt-2">Your Matches</h1>
          </div>
          <AILabel />
        </div>
        <Suspense fallback={<div className="grid gap-6 sm:grid-cols-3"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense>
      </div>
    </div>
  );
}

function Design2({ answers }: any) {
  return (
    <div className="min-h-screen bg-[#f5f1ec] pt-24 px-6 lg:px-12 pb-12">
      <div className="mx-auto max-w-[1400px] grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
          <AILabel />
          <h1 className="text-[42px] font-medium text-[#111111] leading-[1.1]">Careers<br/>For You.</h1>
          <p className="text-[15px] text-[#626260]">Select any career to see your step-by-step roadmap.</p>
        </div>
        <div className="lg:col-span-8">
          <Suspense fallback={<div className="grid gap-5 sm:grid-cols-2"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense>
        </div>
      </div>
    </div>
  );
}

function Design3({ answers }: any) {
  return (
    <div className="min-h-screen bg-[#f5f1ec]">
      <div className="bg-[#111111] pt-32 pb-32 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <AILabel />
          <h1 className="text-[48px] font-medium text-white mt-6">Future Mapped.</h1>
          <p className="text-[#9c9fa5] mt-4">Optimal career trajectories aligned with your potential.</p>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 -mt-16 relative z-10 pb-20">
        <Suspense fallback={<div className="grid gap-4 sm:grid-cols-3"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense>
      </div>
    </div>
  );
}

function Design4({ answers }: any) {
  return (
    <div className="min-h-screen bg-white pt-32 px-6 pb-20">
      <div className="mx-auto max-w-4xl flex flex-col items-center">
        <div className="text-center mb-16">
          <AILabel />
          <h1 className="text-[40px] font-medium text-[#111111] mt-6">Discovery Results</h1>
          <div className="h-px w-12 bg-[#d3cec6] mx-auto mt-6"></div>
        </div>
        <div className="w-full">
          <Suspense fallback={<div className="grid gap-6 sm:grid-cols-2"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense>
        </div>
      </div>
    </div>
  );
}

function Design5({ answers }: any) {
  return (
    <div className="min-h-screen bg-[#ebe7e1] pt-24 p-6 lg:p-10">
      <div className="mx-auto max-w-[1200px] bg-white rounded-[24px] shadow-sm border border-[#d3cec6] overflow-hidden min-h-[80vh]">
        <div className="px-8 py-6 bg-[#fefdfb] border-b border-[#d3cec6] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-[#f5f1ec] flex items-center justify-center border border-[#d3cec6]">✨</div>
            <h1 className="text-[20px] font-medium text-[#111111]">Career Matches</h1>
          </div>
          <AILabel />
        </div>
        <div className="p-8 pb-12 bg-[#fefdfb]">
          <Suspense fallback={<div className="grid gap-5 sm:grid-cols-3"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense>
        </div>
      </div>
    </div>
  );
}

function Design6({ answers }: any) {
  return (
    <div className="min-h-screen bg-[#ebe7e1] pt-28 p-6 lg:p-8 flex items-center">
      <div className="mx-auto w-full max-w-7xl grid lg:grid-cols-[350px_1fr] gap-6">
        <div className="bg-white rounded-[20px] border border-[#d3cec6] p-8 h-fit lg:sticky lg:top-28">
          <div className="flex items-center gap-3 text-[#ff5600] mb-6"><Icons.Activity /><span className="text-[14px] font-bold uppercase">Analysis Complete</span></div>
          <h2 className="text-[28px] font-medium text-[#111111] mb-6">Profile Match</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[13px] mb-2 font-medium"><span>Aptitude</span><span className="text-[#ff5600]">94%</span></div>
              <div className="h-2 w-full bg-[#f5f1ec] rounded-full"><div className="h-full bg-[#ff5600] rounded-full w-[94%]" /></div>
            </div>
            <div>
              <div className="flex justify-between text-[13px] mb-2 font-medium"><span>Interests</span><span className="text-[#ff5600]">88%</span></div>
              <div className="h-2 w-full bg-[#f5f1ec] rounded-full"><div className="h-full bg-[#111111] rounded-full w-[88%]" /></div>
            </div>
          </div>
          <hr className="my-8 border-[#d3cec6]" /><AILabel />
        </div>
        <div className="bg-white rounded-[20px] border border-[#d3cec6] p-8 min-h-[70vh]">
          <h3 className="text-[18px] font-medium text-[#111111] mb-6 flex items-center gap-2"><Icons.Briefcase /> Recommended Paths</h3>
          <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense>
        </div>
      </div>
    </div>
  );
}

function Design7({ answers }: any) {
  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="border-t-[8px] border-[#ff5600] w-full" />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="flex justify-between pb-10 border-b-2 border-[#111111]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#fff0e6] text-[#ff5600] rounded-full text-[12px] font-bold mb-4"><Icons.Compass /> Pathfinding</div>
            <h1 className="text-[40px] font-semibold text-[#111111]">Discovery Results.</h1>
          </div>
          <AILabel />
        </header>
        <div className="py-8 border-b border-[#d3cec6]">
          <div className="flex justify-between text-[11px] uppercase tracking-wider text-[#626260] mb-3">
            <span>Assessment</span><span>Computation</span><span className="text-[#ff5600] font-bold">Results</span>
          </div>
          <div className="h-1 w-full flex"><div className="bg-[#111111] w-1/3" /><div className="bg-[#111111] w-1/3 border-l border-white" /><div className="bg-[#ff5600] w-1/3 border-l border-white" /></div>
        </div>
        <main className="py-12"><Suspense fallback={<div className="grid gap-6 sm:grid-cols-3"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense></main>
      </div>
    </div>
  );
}

function Design8({ answers }: any) {
  return (
    <div className="min-h-screen bg-[#f5f1ec] pt-28 px-4 sm:px-6 pb-12">
      <div className="mx-auto max-w-4xl flex flex-col gap-6">
        <div className="bg-[#111111] rounded-[16px] p-8 text-white relative overflow-hidden">
          <AILabel />
          <h1 className="text-[32px] font-medium mt-6 mb-4">Algorithm Complete.</h1>
          <div className="flex items-center gap-4 mt-8">
            <div className="text-[12px] uppercase tracking-widest font-bold">Confidence</div>
            <div className="flex-1 h-[2px] bg-[#333333]"><div className="h-full bg-[#ff5600] w-[92%]" /></div>
            <div className="text-[12px] text-[#ff5600] font-bold">92%</div>
          </div>
        </div>
        <div className="bg-white border border-[#d3cec6] rounded-[16px] p-8">
          <div className="mb-6 flex items-center justify-between"><h2 className="text-[18px] font-medium">Curated Matches</h2><Icons.Target /></div>
          <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense>
        </div>
      </div>
    </div>
  );
}

function Design9({ answers }: any) {
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row pt-16">
      <aside className="w-full md:w-[280px] md:fixed md:bottom-0 md:top-16 bg-[#f5f1ec] border-r border-[#d3cec6] p-8 flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 bg-[#ff5600] rounded-xl flex items-center justify-center text-white mb-8"><Icons.Zap /></div>
          <h2 className="text-[24px] font-semibold text-[#111111] mb-8">AI Engine</h2>
          <div className="space-y-4">
            <div className="flex flex-col gap-1"><span className="text-[10px] uppercase font-bold text-[#9c9fa5]">Status</span><span className="text-[13px] font-medium flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#ff5600]" /> Complete</span></div>
          </div>
        </div>
        <AILabel />
      </aside>
      <main className="flex-1 md:ml-[280px] p-8 lg:p-16 bg-[#faf9f8]">
        <div className="max-w-4xl">
          <h1 className="text-[32px] font-medium text-[#111111] mb-2">Available Trajectories</h1>
          <hr className="my-8 border-[#d3cec6]" />
          <Suspense fallback={<div className="grid gap-5 sm:grid-cols-2"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense>
        </div>
      </main>
    </div>
  );
}

function Design10({ answers }: any) {
  return (
    <div className="min-h-screen bg-[#f5f1ec] pt-28 pb-16 px-6">
      <div className="mx-auto max-w-3xl relative">
        <div className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-[#ff5600] opacity-30 hidden md:block" />
        <div className="relative z-10 flex flex-col gap-12">
          <div className="flex gap-8">
            <div className="hidden md:flex shrink-0 w-12 h-12 bg-[#ff5600] rounded-full items-center justify-center text-white border-[4px] border-[#f5f1ec]"><Icons.Target /></div>
            <div>
              <AILabel />
              <h1 className="text-[36px] font-medium mt-4 text-[#111111]">Custom Timeline</h1>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="hidden md:flex shrink-0 w-12 h-12 bg-[#111111] rounded-full items-center justify-center text-white border-[4px] border-[#f5f1ec]"><Icons.Compass /></div>
            <div className="flex-1 bg-white border border-[#d3cec6] rounded-[16px] p-6">
              <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Design11({ answers }: any) {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-6 flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col items-center text-center mb-16">
        <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#f5f1ec" strokeWidth="8" /><circle cx="50" cy="50" r="45" fill="none" stroke="#ff5600" strokeWidth="8" strokeDasharray="283" strokeDashoffset="28" /></svg>
          <span className="absolute text-[18px] font-bold">90%</span>
        </div>
        <AILabel />
        <h1 className="mt-6 text-[42px] font-medium">Match Success</h1>
      </div>
      <div className="w-full max-w-5xl border-t border-[#d3cec6] pt-16">
        <Suspense fallback={<div className="grid gap-6 sm:grid-cols-3"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense>
      </div>
    </div>
  );
}

function Design12({ answers }: any) {
  return (
    <div className="min-h-screen bg-[#ebe7e1] pt-24 p-6 lg:p-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex justify-between items-center bg-white p-6 rounded-[12px] border border-[#d3cec6] mb-8">
          <div className="flex items-center gap-4"><div className="p-3 bg-[#fff0e6] rounded-lg text-[#ff5600]"><Icons.Activity /></div><div><h1 className="text-[20px] font-bold">Mentora Board</h1></div></div>
          <div className="flex gap-1"><div className="w-8 h-1.5 bg-[#111111] rounded-full" /><div className="w-8 h-1.5 bg-[#111111] rounded-full" /><div className="w-8 h-1.5 bg-[#ff5600] rounded-full shadow-[0_0_8px_#ff5600]" /></div>
        </div>
        <div className="bg-[#f5f1ec] p-6 rounded-[16px] border border-[#d3cec6]">
          <h2 className="text-[14px] font-bold uppercase mb-6 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#ff5600]" /> Tracks</h2>
          <Suspense fallback={<div className="grid gap-4 sm:grid-cols-4"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense>
        </div>
      </div>
    </div>
  );
}

function Design13({ answers }: any) {
  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center pt-24 p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col">
        <div className="h-2 w-full bg-gradient-to-r from-[#ff5600] to-[#ff8c42]" />
        <div className="p-8 sm:p-12">
          <div className="flex justify-between items-start mb-10">
            <div><h1 className="text-[32px] font-medium leading-tight">Discovery<br/>Report</h1></div>
            <AILabel />
          </div>
          <div className="bg-[#f5f1ec] rounded-[16px] p-6 border border-[#d3cec6]">
            <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

function Design14({ answers }: any) {
  return (
    <div className="min-h-screen bg-[#f5f1ec] font-mono pt-16">
      <div className="max-w-6xl mx-auto border-x border-[#d3cec6] min-h-screen">
        <header className="border-b border-[#d3cec6] p-6 bg-white flex justify-between items-center">
          <div><p className="text-[11px] text-[#ff5600] uppercase font-bold">SYS.OUT // RESULTS</p><h1 className="text-[28px] font-sans font-medium text-[#111111]">Mentora Output</h1></div>
          <div className="p-3 border border-[#d3cec6] rounded-lg bg-[#f5f1ec]"><AILabel /></div>
        </header>
        <div className="border-b border-[#d3cec6] bg-white flex text-[12px]">
          <div className="p-4 border-r border-[#d3cec6] flex-1">DATA: <span className="font-bold">ANALYZED</span></div>
          <div className="p-4 border-r border-[#d3cec6] flex-1 flex items-center gap-2">PROG: <div className="flex-1 h-2 bg-[#ebe7e1]"><div className="h-full bg-[#ff5600] w-[100%]" /></div></div>
        </div>
        <main className="p-8 bg-[#faf9f8] font-sans"><Suspense fallback={<div className="grid gap-6 sm:grid-cols-3"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense></main>
      </div>
    </div>
  );
}

function Design15({ answers }: any) {
  return (
    <div className="min-h-screen bg-white relative pb-24 pt-28">
      <div className="px-6 max-w-6xl mx-auto">
        <AILabel />
        <h1 className="text-[60px] lg:text-[100px] font-semibold leading-[0.9] tracking-[-3px] text-[#111111] mt-8 mb-12">Discover<br/><span className="text-[#ff5600]">Your Path.</span></h1>
        <div className="flex items-center gap-6 py-8 border-y border-[#111111] mb-12"><div className="w-12 h-12 bg-[#f5f1ec] rounded-full flex items-center justify-center"><Icons.Compass /></div><p className="text-[18px] text-[#626260] font-medium">Potential trajectories designed for you.</p></div>
        <Suspense fallback={<div className="grid gap-6 sm:grid-cols-3"><SkeletonCard /></div>}><CareerResults answers={answers} /></Suspense>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-[#111111] text-white p-4 flex items-center justify-center gap-6 z-50">
        <span className="text-[13px] font-medium uppercase tracking-widest text-[#9c9fa5]">Profile Synced</span>
        <div className="w-[300px] h-1 bg-[#333333] rounded-full"><div className="h-full bg-[#ff5600] w-full" /></div>
      </div>
    </div>
  );
}

// ------------------------------------------
// NEW DESIGNS (16-19)
// ------------------------------------------

function Design16({ answers }: any) {
  return (
    <div className="min-h-screen bg-[#ebe7e1] pt-24 pb-16 px-6">
      <div className="mx-auto max-w-5xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff5600] rounded-full blur-[100px] opacity-20 pointer-events-none" />
        <div className="bg-white/60 backdrop-blur-xl border border-white p-8 sm:p-12 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block bg-white px-4 py-2 rounded-full border border-[#d3cec6] mb-6 shadow-sm"><AILabel /></div>
            <h1 className="text-[44px] font-medium text-[#111111] leading-tight mb-4">Your Professional<br/>Blueprint</h1>
          </div>
          <Suspense fallback={<div className="grid gap-6 sm:grid-cols-2"><SkeletonCard /></div>}>
            <div className="bg-white/80 p-6 rounded-[24px] border border-white">
              <CareerResults answers={answers} />
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function Design17({ answers }: any) {
  return (
    <div className="min-h-screen bg-[#111111] pt-24 pb-16 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="border border-[#333333] rounded-[12px] bg-[#1a1a1a] overflow-hidden shadow-2xl font-mono">
          <div className="bg-[#2a2a2a] px-4 py-3 flex items-center gap-3 border-b border-[#333333]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5600]" />
              <div className="w-3 h-3 rounded-full bg-[#d3cec6]" />
              <div className="w-3 h-3 rounded-full bg-[#ebe7e1]" />
            </div>
            <span className="text-[12px] text-[#9c9fa5] ml-4">mentora_career_gen.sh</span>
          </div>
          <div className="p-6 sm:p-8 text-[#d3cec6]">
            <p className="text-[13px] text-[#ff5600] mb-4">{">"} Executing career matching algorithm...</p>
            <p className="text-[13px] mb-8">{">"} Match found. Displaying optimal paths:</p>
            <div className="font-sans">
              <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2"><SkeletonCard /></div>}>
                <CareerResults answers={answers} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Design18({ answers }: any) {
  return (
    <div className="min-h-screen bg-[#fefdfb] pt-24 pb-20 px-6 border-[16px] border-[#111111]">
      <div className="mx-auto max-w-4xl pt-10">
        <div className="flex justify-between items-end border-b-4 border-[#111111] pb-6 mb-12">
          <div>
            <span className="text-[14px] font-bold uppercase tracking-[0.3em] text-[#ff5600] block mb-4">Edition 01</span>
            <h1 className="text-[56px] font-serif font-bold text-[#111111] leading-[0.9] tracking-tight">The Guide.</h1>
          </div>
          <div className="mb-2"><AILabel /></div>
        </div>
        <div className="prose prose-lg max-w-none mb-12 text-[#626260]">
          <p className="text-[20px] leading-relaxed">Through rigorous psychometric analysis and market alignment, we present a curated selection of disciplines suited specifically to your cognitive and creative profile.</p>
        </div>
        <Suspense fallback={<div className="grid gap-8 sm:grid-cols-2"><SkeletonCard /></div>}>
          <CareerResults answers={answers} />
        </Suspense>
      </div>
    </div>
  );
}

function Design19({ answers }: any) {
  return (
    <div className="min-h-screen bg-[#f5f1ec] pt-24 pb-16">
      <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-8">
        <div className="bg-white rounded-[24px] border border-[#d3cec6] p-8 sm:p-12 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="px-4 py-2 bg-[#111111] text-white rounded-[12px] text-[13px] font-bold uppercase tracking-wide">Phase 3</div>
            <h1 className="text-[28px] font-bold text-[#111111]">Select Your Class</h1>
          </div>
          <Suspense fallback={<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"><SkeletonCard /></div>}>
            <CareerResults answers={answers} />
          </Suspense>
        </div>
        
        {/* Right HUD Sidebar */}
        <div className="bg-[#111111] text-white rounded-[24px] p-8 hidden xl:flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Icons.Zap /></div>
          <h3 className="text-[18px] font-bold uppercase tracking-widest text-[#ff5600] mb-8">Stats</h3>
          <div className="space-y-6 flex-1">
            <div className="bg-[#222222] p-4 rounded-[12px]">
              <span className="block text-[11px] text-[#9c9fa5] uppercase mb-1">Logic</span>
              <div className="flex gap-1">{[1,2,3,4,5].map(i => <div key={i} className={`h-2 flex-1 rounded-full ${i<=4 ? 'bg-[#ff5600]' : 'bg-[#333333]'}`} />)}</div>
            </div>
            <div className="bg-[#222222] p-4 rounded-[12px]">
              <span className="block text-[11px] text-[#9c9fa5] uppercase mb-1">Creativity</span>
              <div className="flex gap-1">{[1,2,3,4,5].map(i => <div key={i} className={`h-2 flex-1 rounded-full ${i<=3 ? 'bg-[#ff5600]' : 'bg-[#333333]'}`} />)}</div>
            </div>
          </div>
          <div className="mt-auto border-t border-[#333333] pt-6 flex justify-between items-center">
            <AILabel />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN EXPORT (Controller)
// ==========================================

export default async function AssessmentResultsPage({ searchParams }: Props) {
  const params = await searchParams;
  let answers: AssessmentAnswer[] = [];
  
  const activeDesign = params.design || "1";

  if (params.answers) {
    try {
      answers = JSON.parse(params.answers) as AssessmentAnswer[];
    } catch {
      answers = [];
    }
  }

  if (answers.length === 0) {
    return <EmptyDataState />;
  }

  const RenderDesign = () => {
    switch (activeDesign) {
      case "2": return <Design2 answers={answers} />;
      case "3": return <Design3 answers={answers} />;
      case "4": return <Design4 answers={answers} />;
      case "5": return <Design5 answers={answers} />;
      case "6": return <Design6 answers={answers} />;
      case "7": return <Design7 answers={answers} />;
      case "8": return <Design8 answers={answers} />;
      case "9": return <Design9 answers={answers} />;
      case "10": return <Design10 answers={answers} />;
      case "11": return <Design11 answers={answers} />;
      case "12": return <Design12 answers={answers} />;
      case "13": return <Design13 answers={answers} />;
      case "14": return <Design14 answers={answers} />;
      case "15": return <Design15 answers={answers} />;
      case "16": return <Design16 answers={answers} />;
      case "17": return <Design17 answers={answers} />;
      case "18": return <Design18 answers={answers} />;
      case "19": return <Design19 answers={answers} />;
      case "1":
      default: return <Design1 answers={answers} />;
    }
  };

  return (
    <>
      <DesignSwitcher currentDesign={activeDesign} />
      <RenderDesign />
    </>
  );
}