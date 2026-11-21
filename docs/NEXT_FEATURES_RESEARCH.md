# Mentora AI: What to Build Next

*Research note, November 2026. Written for the project owner and supervisor.*

## Recommendation: build the AI Mock Interview Coach first

Mentora already takes a student from "what should I study?" to "I can prove I know it": assessment, roadmap, tests, real code execution, certificates, projects and internships. The step it does not cover is the one where students actually get hired or rejected, which is the interview.

Why this should come first:

1. **It is the most reported gap in Pakistan.** In one employer survey, 83.6% of employers named verbal communication as the skill fresh graduates most lack ([ProPakistani, 2016](https://propakistani.pk/2016/08/16/77-of-employers-not-happy-with-the-quality-of-pakistani-graduates-survey/)). P@SHA's 2025 skills report says employers see weak soft skills as a barrier to hiring. It also found that 72% of last year's hiring went to experienced people and that member firms absorbed only 18.3% of graduates. Employers said new graduates lack "communication discipline" and take too long to become productive ([CW Pakistan summary of the P@SHA Skills Report 2025](https://cwpakistan.com/pasha-it-skills-panorama-a-talent-ledger-for-the-digital-age/)). A Gallup Pakistan study named weak English and poor readiness to deal with foreign clients as reasons graduates are not employable ([ProPakistani](https://propakistani.pk/2020/07/15/only-10-of-it-graduates-are-employable-in-pakistan-gallup/)).
2. **Practice helps, and stress hurts.** In a randomized trial with 48 CS students, being watched during a whiteboard interview raised stress and lowered scores, so interviews partly measure anxiety ([Behroozi et al., ESEC/FSE 2020](https://2020.esec-fse.org/details/fse-2020-papers/140/Does-Stress-Impact-Technical-Interview-Performance-)). Studies of mock interviews, including AI-run ones, report lower anxiety and more confidence afterwards ([AI mock technical interviews, n=20](https://arxiv.org/abs/2506.16542); [virtual mock interview, n=19](https://www.pubmed.gov/37561904/)). These studies are small, so the honest claim is that practice reduces anxiety and builds confidence, not that it is proven to lead to more job offers.
3. **No competitor fills this gap for these students.** Exponent's AI mock interviews are only in its top plan (about $99 a month, [PracHub](https://prachub.com/resources/exponent-pricing)). Google Interview Warmup is free but does not grade answers, and Pramp is peer-only with no AI feedback ([comparison](https://dev.to/feng_zhang_cedb4581bee881/7-best-ai-mock-interview-platforms-in-2026-5hbf)). None of them knows what the student has studied, and none copies the Pakistani software-house hiring process: a written MCQ/aptitude test, then technical interviews, then an HR round ([Arbisoft](https://arbisoft.com/blogs/arbisoft-s-fresh-graduate-hiring-insights-and-experiences), [Contour on Glassdoor](https://www.glassdoor.ca/Interview/Contour-Software-Junior-Software-Developer-Interview-Questions-EI_IE1902535.0,16_KO17,42.htm)).
4. **It is already planned.** It is item 11 in `TODOS.md`, and it reuses almost everything already built (see Feature 1).
5. **It makes the best live demo for a viva.** An examiner can answer three questions and watch them get scored on the spot.

---

## Ranked features

Effort: **S** is about 2 to 4 days, **M** is about 1 to 2 weeks, **L** is more than 2 weeks (one developer).

### 1. AI Mock Interview Coach (effort: M)

**Student problem.** Students may know the material but fail the interview. The main reasons are weak spoken English, rambling answers, nerves, and never having practised the local hiring process. Pakistan ranks 67th of 123 countries on the EF English Proficiency Index, in the "Low" band, and its weakest sub-skill is listening (470) ([EF EPI 2025](https://www.ef.com/wwen/epi/regions/asia/pakistan/)). Very few universities offer career services: 96% of students surveyed at Quaid-e-Azam University said there was no proper career counselling ([PIDE thesis](https://thesis.pide.org.pk/?p=600)). Most students therefore have no one to practise with.

**What it does.**
- The student picks a target: a career from their assessment, an internship from the board, or a generic "fresh-graduate SE".
- Three rounds, mirroring local hiring:
  - **Screening:** a timed MCQ and aptitude test, with one coding problem.
  - **Technical:** 4 to 6 questions on the student's own roadmap topics and their own blueprint project ("walk me through your project's database design").
  - **HR/behavioural:** STAR-style questions such as "tell me about a conflict in your team".
- Answers are typed, or spoken through the browser's built-in speech-to-text, which is free and uses very little data.
- Each answer is scored on a fixed rubric: correctness, structure, clarity, and English (grammar, filler words, length). The student gets a model answer and one concrete fix.
- An end-of-session report lists weak topics. Those topics go into the existing adaptive spaced-repetition review queue. The student also earns XP and a "Interview-ready: X%" score.

**Reuse.** Questions come from the milestone-test generator. The coding round uses the real code execution practice. Grading follows the same pattern as the practice evaluation in `src/app/api/practice/evaluate`. Weak topics go into the adaptive review in `src/lib/adaptive`. Sessions are charged through the credits system in `src/lib/credits`, award XP through gamification, and send a "you haven't practised in 3 days" nudge through notifications. The AI evaluation dashboard can measure how consistent the grader is.

**Viva demo value: very high.** It runs live, it is interactive, and it shows several AI techniques at once: question generation, rubric grading, and adaptive follow-up.

**Risks.**
- The AI grader may be inconsistent. Mitigate with a fixed rubric, JSON output, and a small hand-labelled set checked on the evaluation dashboard.
- Browser speech recognition works best in Chrome. Keep typed answers as the default.
- AI costs. Cap each session at a fixed number of questions and charge credits.
- Do not claim "gets you hired". Claim practice and feedback.

### 2. Verified CV and public portfolio page (effort: S to M)

**Student problem.** Recruiters first look at a CV for about 7.4 seconds ([Ladders eye-tracking study](https://www.hrdive.com/news/eye-tracking-study-shows-recruiters-look-at-resumes-for-7-seconds/541582/)). Employers rank problem-solving (88%) and teamwork (81%) above GPA when they screen new graduates ([NACE Job Outlook 2025 summary](https://career.pennwest.edu/blog/2025/10/14/what-are-employers-looking-for-when-reviewing-college-students-resumes-from-nace/)). Fresh graduates usually have no proof of skill except a degree.

**What it does.** One click builds an ATS-friendly CV (PDF) and a public page at `/u/<name>`. Both list only evidence Mentora has verified: certificates with their QR verify links, milestone test scores, number of challenges solved with code that actually ran, blueprint projects with repo links, study hours, and the interview-readiness score. The AI writes the bullet points from that data, and the student can edit them.

**Reuse.** Certificate PDF generation and the `/verify/[code]` page, the skill profile, blueprints and progress data. Most of the work is collecting and presenting data that already exists.

**Viva demo value: high.** "Scan this QR on my CV and the certificate verifies."

**Risks.**
- Privacy. The public page should be off by default and opt-in.
- The AI must not invent skills. Generate only from database fields.

### 3. Job-match gap check on the internships board (effort: S)

**Student problem.** P@SHA finds that what employers ask for (full-stack JavaScript, .NET, Python, React Native/Flutter, AWS for freshers) differs from what universities teach ([CW Pakistan / P@SHA 2025](https://cwpakistan.com/pasha-it-skills-panorama-a-talent-ledger-for-the-digital-age/)). Students apply blindly.

**What it does.** Each internship card shows "You match 6 of 9 required skills; missing: Docker, SQL joins". One button adds the missing skills as nodes to the student's roadmap, and another starts a mock interview for that posting (links to Feature 1).

**Reuse.** The scraper's postings, the explainable skill profile, and roadmap generation. Skill extraction from postings is one AI call per posting, cached.

**Viva demo value: medium to high.** It connects the scraper, the skill profile and the roadmap in a single click.

**Risks.**
- Scraped postings are messy. Extract skills once when a posting is scraped, not on every page view.

### 4. Freelancing starter track (effort: M)

**Student problem.** Many Pakistani CS students turn to freelancing because local entry-level hiring is weak. Payoneer claims more than 3 million active Pakistani freelancers, but that is a vendor figure ([Payoneer](https://www.payoneer.com/resources/business/top-10-freelancing-countries/)). Pakistan has also been ranked among the fastest-growing freelance markets, with many freelancers under 30 ([The News](https://thenews.com.pk/latest/516793-pakistan-ranks-4th-among-worlds-fastest-growing-freelance-markets)). Before citing earnings numbers, get them from SBP's IT-export releases. Gallup's employability findings specifically name the inability to handle foreign clients ([ProPakistani](https://propakistani.pk/2020/07/15/only-10-of-it-graduates-are-employable-in-pakistan-gallup/)).

**What it does.**
- A short roadmap template covering profile, gig or niche choice, pricing, and payouts through Payoneer or local banks.
- An AI **proposal reviewer:** the student pastes a job post and their proposal, and gets a score and a rewrite.
- A **client-chat simulator** that reuses the Feature 1 engine with a "foreign client" persona.

**Reuse.** The roadmap generator, the tutor chat, and the Feature 1 engine.

**Viva demo value: medium.** It is very relevant to Pakistan and stands out in a viva, but it is less technically new once Feature 1 exists.

**Risks.**
- Platform rules and fees change, for example Upwork's 0 to 15% variable fee since 2025. Link to official pages instead of hard-coding details.
- Avoid "get rich" framing.

### 5. Urdu / Roman-Urdu explanation toggle (effort: S)

**Student problem.** Teaching in Pakistan is officially in English, but understanding suffers. In one study, 68% of students said they learn better when the teacher switches into their first language ([JEELS 2022](https://doaj.org/article/5141d8d44f0d49df91d2dc146447ee74)). A Glasgow computing-education paper suggests Urdu explanations as scaffolding for Pakistani students learning programming ([Glasgow eprint](https://eprints.gla.ac.uk/255566/1/255566.pdf)).

**What it does.** A setting that makes the tutor chat, test explanations and code feedback answer in Roman Urdu (or Urdu script), while keeping technical terms and code in English. Interviews stay in English, because interviews are in English.

**Reuse.** It is one prompt parameter in `src/lib/ai/client.ts` plus a profile column. This is the cheapest feature on the list.

**Viva demo value: medium.** It is easy to show and clearly local, but technically thin.

**Risks.**
- The model's Urdu quality varies. Test it with a few native speakers first.
- Some parents and students prefer English-only ([British Council Punjab study](https://www.britishcouncil.pk/sites/default/files/language-teaching-and-learning-in-punjab-schools.pdf)), so keep it opt-in.

### 6. Company-style screening test simulator (effort: S, or fold into Feature 1)

**Student problem.** The first filter at most software houses is a written or online test: MCQs on OOP, DSA, databases and aptitude, plus coding, often with a cut-off ([Arbisoft](https://arbisoft.com/blogs/arbisoft-s-fresh-graduate-hiring-insights-and-experiences), [Technosoft](https://www.glassdoor.sg/Interview/Technosoft-Pakistan-Interview-E1710220-RVW20701775.htm)). Students meet this format for the first time on the real day.

**What it does.** A timed 30-minute test in that format, with a pass/fail cut-off and a review of each topic afterwards.

**Reuse.** The milestone-test engine plus code execution. It is mostly a timer and a new question mix. **Build it as Round 1 of Feature 1** rather than as a separate feature.

**Viva demo value: medium.**

**Risks.**
- Do not present questions as a specific company's real test. Label them "in the style of".

---

## What not to build (now)

| Idea | Why not |
|---|---|
| **Coding 1v1 games (TODO 6)** | Needs real-time infrastructure and enough online users to match players. With a small user base, matchmaking fails and the feature looks empty in a demo. There is no evidence that it improves employability. |
| **Human mentor marketplace** | Needs a supply of mentors, payments, scheduling and trust and safety. That is a separate business, not an FYP feature. |
| **Live "interview copilot" (whispers answers during real interviews)** | This is cheating. It is an ethics problem for a university project and the opposite of the goal. Practice tools are fine; live-assist tools are not. |
| **Webcam or face/emotion scoring in interviews** | It has a well-known bias problem, raises privacy issues, and uses a lot of data. Pakistan's internet use is limited by cost: only 29% use mobile internet despite wide coverage ([GSMA 2025](https://www.gsma.com/about-us/regions/asia-pacific/wp-content/uploads/2025/07/Unlocking-Pakistan-digital-future-FINAL.pdf)). Text and voice are enough. |
| **Own video lecture library** | Learners already use YouTube heavily: 70% of learners vs 60% of professionals ([Stack Overflow 2025](https://stackoverflow.blog/2025/07/29/developers-remain-willing-but-reluctant-to-use-ai-the-2025-developer-survey-results-are-here/)). Linking to verified resources, which is already being built, is enough. |
| **Employer-side job portal / ATS** | A two-sided marketplace competes with Rozee.pk and LinkedIn. Keep the scraped internships board and send students to the original postings. |
| **Native mobile app** | The web app is already responsive. A separate codebase doubles the work for no new value in the viva. |

---

## Context on the evidence

- The headline Pakistan statistics are older than they look. PIDE's "31% of educated youth unemployed" figure comes from a 2022 report ([Tribune](https://tribune.com.pk/story/2342344/entertainment)). A later PIDE analysis puts graduate unemployment at 16.1% for 2020-21 ([Dawn](https://www.dawn.com/news/1746686)). The "only 10% employable" figure applies to graduates of lower-tier universities only. Quote these carefully in the thesis.
- Entry-level tech hiring is shrinking worldwide. New-graduate hiring at the 15 largest tech firms is down more than 50% since 2019 ([SignalFire via TechCrunch](https://techcrunch.com/?p=3012091)), and employment for 22 to 25 year-olds in AI-exposed jobs is down 13% relative to other occupations ([Stanford "Canaries" via The Register](https://www.theregister.com/2025/08/26/ai_hurts_recent_college_grads_jobs/)). Fewer openings make each interview matter more, which supports Feature 1.
- The AI-tutor approach Mentora already uses has strong support. In a Harvard randomized trial with 194 students, an AI tutor produced roughly double the learning gains of an active-learning class, in less time ([Kestin et al., Scientific Reports 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12179260/)). Feature 1 applies the same idea to interview practice.
- Some figures come from secondary reporting and were not checked against the original: the P@SHA 2025 numbers (taken from CW Pakistan's summary), the freelancing numbers (Payoneer's own claims; an undated news ranking) and competitor pricing. Check the originals before putting them in the final report.
