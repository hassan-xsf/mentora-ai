// Static fragments of the real product UI for the landing page. They reuse the
// app's own styling so what visitors see is what they get after signing up.

function Frame({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <figure
      role="img"
      aria-label={label}
      className="overflow-hidden rounded-[16px] border border-[#d3cec6] bg-white shadow-[0_8px_40px_rgba(17,17,17,0.06)]"
    >
      <div className="flex items-center gap-2 border-b border-[#ebe7e1] px-4 py-2.5" aria-hidden>
        <span className="h-2 w-2 rounded-full bg-[#d3cec6]" />
        <span className="h-2 w-2 rounded-full bg-[#d3cec6]" />
        <span className="h-2 w-2 rounded-full bg-[#d3cec6]" />
        <span className="ml-2 truncate text-[11px] text-[#9c9fa5]">{title}</span>
      </div>
      <div className="p-4 sm:p-5" aria-hidden>
        {children}
      </div>
    </figure>
  );
}

function Bar({ pct, color = "#111111" }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ebe7e1]">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function RoadmapMock() {
  const sections = [
    { name: "Foundations", status: "passed", nodes: ["HTML & semantics", "CSS layout", "JavaScript basics"], done: 3 },
    { name: "Intermediate", status: "active", nodes: ["React components", "State & effects", "Fetching data"], done: 1 },
    { name: "Advanced", status: "locked", nodes: ["Testing", "Performance", "Deploying"], done: 0 },
  ] as const;
  return (
    <Frame
      label="Roadmap screen: a Frontend Developer roadmap with Foundations passed, Intermediate in progress and Advanced locked until its milestone test is passed."
      title="Frontend Developer roadmap"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Your roadmap</p>
          <p className="mt-0.5 text-[17px] font-medium tracking-[-0.2px] text-[#111111]">Frontend Developer</p>
        </div>
        <span className="rounded-[4px] bg-[#f5f1ec] px-2 py-0.5 text-[11px] font-medium text-[#626260]">44%</span>
      </div>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div
            key={s.name}
            className={`rounded-[10px] border px-3.5 py-3 ${
              s.status === "active" ? "border-[#111111]" : "border-[#ebe7e1]"
            } ${s.status === "locked" ? "bg-[#f5f1ec] opacity-70" : "bg-white"}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12px] font-medium text-[#111111]">
                {i + 1}. {s.name}
              </p>
              <span
                className={`rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium ${
                  s.status === "passed"
                    ? "bg-[#0bdf50]/15 text-[#0a8a35]"
                    : s.status === "active"
                      ? "bg-[#ff5600]/10 text-[#c94400]"
                      : "bg-[#ebe7e1] text-[#626260]"
                }`}
              >
                {s.status === "passed" ? "Test passed · 86%" : s.status === "active" ? "In progress" : "🔒 Pass test to unlock"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {s.nodes.map((n, j) => (
                <span
                  key={n}
                  className={`rounded-[6px] border px-2 py-1 text-[11px] ${
                    j < s.done ? "border-[#111111] bg-[#111111] text-white" : "border-[#d3cec6] text-[#626260]"
                  }`}
                >
                  {j < s.done ? "✓ " : ""}
                  {n}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function CareerMock() {
  const careers = [
    { title: "Frontend Developer", fit: 92, demand: "High" },
    { title: "Data Analyst", fit: 81, demand: "High" },
    { title: "QA Engineer", fit: 68, demand: "Medium" },
  ];
  return (
    <Frame
      label="Career discovery results: Frontend Developer 92% fit, Data Analyst 81% fit, QA Engineer 68% fit, each with market demand."
      title="Career discovery · results"
    >
      <p className="mb-3 text-[12px] text-[#626260]">Based on your 10 answers, these fit you best:</p>
      <div className="space-y-2.5">
        {careers.map((c, i) => (
          <div key={c.title} className="rounded-[10px] border border-[#ebe7e1] px-3.5 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[13px] font-medium text-[#111111]">{c.title}</p>
              <span className="text-[11px] text-[#9c9fa5]">{c.demand} demand</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Bar pct={c.fit} color={i === 0 ? "#ff5600" : "#111111"} />
              <span className="w-9 shrink-0 text-right text-[12px] font-medium text-[#111111]">{c.fit}%</span>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function PracticeMock() {
  return (
    <Frame
      label="Practice screen: a Python function being run against test cases, three of four passing, with feedback on the failing edge case."
      title="Practice · Python · easy"
    >
      <p className="mb-2 text-[12px] font-medium text-[#111111]">Return the second-largest number in a list.</p>
      <pre className="overflow-x-auto rounded-[8px] bg-[#1e1e1e] p-3 font-mono text-[11.5px] leading-[1.6] text-[#d4d4d4]">
        <span className="text-[#569cd6]">def</span> <span className="text-[#dcdcaa]">second_largest</span>(nums):{"\n"}
        {"    "}uniq = <span className="text-[#dcdcaa]">sorted</span>(<span className="text-[#4ec9b0]">set</span>(nums)){"\n"}
        {"    "}<span className="text-[#c586c0]">return</span> uniq[-<span className="text-[#b5cea8]">2</span>]
      </pre>
      <div className="mt-3 space-y-1.5">
        {[
          { name: "[3, 1, 4] → 3", ok: true },
          { name: "[5, 5, 2] → 2", ok: true },
          { name: "[-1, -7] → -7", ok: true },
          { name: "[9] → None", ok: false },
        ].map((t) => (
          <div key={t.name} className="flex items-center justify-between rounded-[6px] bg-[#f5f1ec] px-2.5 py-1.5 text-[11.5px]">
            <span className="font-mono text-[#111111]">{t.name}</span>
            <span className={t.ok ? "font-medium text-[#0a8a35]" : "font-medium text-[#c41c1c]"}>
              {t.ok ? "passed" : "failed"}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-[8px] border border-[#ebe7e1] px-3 py-2 text-[11.5px] leading-relaxed text-[#626260]">
        <span className="font-medium text-[#111111]">Feedback:</span> handle lists with fewer than two distinct values
        before indexing.
      </p>
    </Frame>
  );
}

export function ReviewMock() {
  return (
    <Frame
      label="Review screen: three topics due today, picked from questions you got wrong in milestone tests."
      title="Review · due today"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-medium text-[#111111]">3 topics due</p>
        <span className="rounded-[4px] bg-[#ff5600]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#c94400]">~6 min</span>
      </div>
      <div className="space-y-2">
        {[
          { t: "CSS specificity", why: "Missed in Foundations test", when: "Due today" },
          { t: "Array.prototype.reduce", why: "Missed twice", when: "Due today" },
          { t: "useEffect cleanup", why: "Missed in quiz", when: "Due today" },
          { t: "Flexbox alignment", why: "Recalled correctly", when: "In 6 days" },
        ].map((r) => (
          <div key={r.t} className="flex items-center justify-between gap-3 rounded-[8px] border border-[#ebe7e1] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-[#111111]">{r.t}</p>
              <p className="text-[11px] text-[#9c9fa5]">{r.why}</p>
            </div>
            <span className={`shrink-0 text-[11px] ${r.when === "Due today" ? "font-medium text-[#111111]" : "text-[#9c9fa5]"}`}>
              {r.when}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function CertificateMock() {
  return (
    <Frame
      label="Certificate: Frontend Foundations, issued to Ayesha Khan, with a public verification code anyone can check."
      title="Certificate"
    >
      <div className="rounded-[10px] border border-[#d3cec6] bg-[#f5f1ec] px-5 py-6 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9c9fa5]">Certificate of completion</p>
        <p className="mt-3 text-[20px] font-medium tracking-[-0.4px] text-[#111111]">Ayesha Khan</p>
        <p className="mt-1 text-[12px] text-[#626260]">completed every topic and passed every milestone test in</p>
        <p className="mt-1 text-[14px] font-medium text-[#111111]">Frontend Foundations</p>
        <div className="mx-auto mt-4 h-px w-16 bg-[#d3cec6]" />
        <p className="mt-3 font-mono text-[11px] text-[#626260]">Verify at /verify/MNT-7K4Q-92XD</p>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-[8px] border border-[#0bdf50]/40 bg-[#0bdf50]/10 px-3 py-2 text-[11.5px] text-[#0a6b2b]">
        <span className="font-medium">✓ Valid</span>
        <span className="text-[#626260]">· checked by a recruiter, no account needed</span>
      </div>
    </Frame>
  );
}

export function InternshipsMock() {
  return (
    <Frame
      label="Internships list: openings in Lahore, Karachi, Islamabad and remote, each tagged with the main skill it asks for."
      title="Internships in Pakistan"
    >
      <div className="space-y-2">
        {[
          { role: "Frontend Intern (React)", where: "Lahore · On-site", match: "React" },
          { role: "Junior Data Analyst Intern", where: "Karachi · Hybrid", match: "SQL" },
          { role: "QA Automation Intern", where: "Islamabad · On-site", match: "Testing" },
          { role: "Web Developer Intern", where: "Remote", match: "JavaScript" },
        ].map((j) => (
          <div key={j.role} className="flex items-center justify-between gap-3 rounded-[8px] border border-[#ebe7e1] px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-[#111111]">{j.role}</p>
              <p className="text-[11px] text-[#9c9fa5]">{j.where}</p>
            </div>
            <span className="shrink-0 rounded-[4px] bg-[#f5f1ec] px-1.5 py-0.5 text-[10px] font-medium text-[#626260]">
              {j.match}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}
