// Builds the five home page designs into public/landing/v1..v5.html.
// Run: node scripts/landing-variants/build.mjs
// Screens in public/landing/shots are real captures of the app (demo student account);
// every number in the copy comes from FEATURES.md or the source it names.
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('public/landing');

// ---------- images ----------
const SHOTS = {
  career: [1440, 900], 'career-profile': [390, 640], 'career-match': [390, 660],
  'roadmap-tree': [760, 840], 'roadmap-topic': [1440, 900], 'topic-panel': [454, 740],
  'test-result': [680, 820], 'test-score': [650, 290], 'roadmap-head': [740, 640], 'review-lesson': [680, 820],
  challenge: [1440, 900], internships: [880, 820], certificate: [680, 780], verify: [700, 740],
  'tutor-drawer': [400, 556], 'build-graph': [1074, 445], progress: [1000, 620], dashboard: [1440, 900],
};
const ALT = {
  career: 'Mentora career matches: a skill profile radar with Design 64 and Building 50, and Frontend Engineer (React) ranked first at 88% fit',
  'career-profile': 'Skill profile radar calculated from the answers, with the strongest and weakest areas explained',
  'career-match': 'Career match card for Frontend Engineer (React): high demand, 88% fit, salary range and why it fits',
  'roadmap-tree': 'Roadmap tree for the Intermediate section: Git and GitHub done, Async JavaScript done, React components in progress',
  'roadmap-topic': 'Roadmap with the React Components, Props and State topic open: verified resources and three build tasks',
  'roadmap-head': 'Roadmap progress for Become a Frontend Engineer (React): 13 of 24 topics done, 54%',
  'topic-panel': 'Topic panel with React docs links marked Verified, a video marked Search and three build tasks',
  'test-result': 'Foundations milestone test passed at 80%, with the missed Flexbox question explained',
  'test-score': 'Foundations milestone test result: 80%, passed, next section unlocked',
  'review-lesson': 'Review lesson for Flexbox alignment explaining the main and cross axis',
  challenge: 'Coding challenge in JavaScript: the problem on the left, the editor on the right and all 7 tests passed with 25 XP',
  internships: 'Internships in Pakistan with filters for city, field and date, recommended against the student’s careers',
  certificate: 'Certificate of completion for Ayesha Khan, Become a Frontend Engineer (React), with a verification code',
  verify: 'Public verification page confirming the certificate was issued to Ayesha Khan on November 23, 2026',
  'tutor-drawer': 'AI tutor answering a question about where search state should live in React',
  'build-graph': 'Project blueprint drawn as a graph of build steps: scaffold, data model, deploy pipeline, core API and auth',
  progress: 'Progress page with level 4, 325 XP and study time for the last 14 days',
  dashboard: 'Mentora dashboard with the next step, review queue, level and roadmaps',
};
const shot = (n, sizes = '(max-width: 960px) 100vw, 700px', eager = false) => {
  const [w, h] = SHOTS[n];
  return `<img src="shots/${n}.webp" srcset="shots/${n}.webp ${w}w, shots/${n}@2x.webp ${w * 2}w" sizes="${sizes}" width="${w}" height="${h}" alt="${ALT[n]}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
};
const URLS = {
  career: 'mentora.ai/assessment/results', 'roadmap-topic': 'mentora.ai/roadmap', challenge: 'mentora.ai/practice/challenge',
  internships: 'mentora.ai/internships', dashboard: 'mentora.ai/dashboard', verify: 'mentora.ai/verify/MNT-AM4K-YPDK',
  'roadmap-tree': 'mentora.ai/roadmap', 'test-result': 'mentora.ai/roadmap/test', 'review-lesson': 'mentora.ai/review',
};
const frame = (n, sizes, eager) => `<figure class="frame" style="margin:0"><div class="frame__bar" aria-hidden="true"><i></i><i></i><i></i><span class="frame__url">${URLS[n] || 'mentora.ai'}</span></div>${shot(n, sizes, eager)}</figure>`;
const card = (n, sizes) => `<figure class="shot" style="margin:0">${shot(n, sizes)}</figure>`;

const PHOTOS = {
  'student-laptop': [2600, 1515, 'A student with glasses working on a laptop at a desk'],
  'campus-bench': [2600, 1676, 'A student working on a laptop on a bench outside a university building'],
  'campus-bench-2': [2600, 1733, 'A student with headphones working on a laptop on a campus bench'],
  'campus-books': [2600, 1733, 'A student in a headscarf holding her books outside a college building'],
  graduates: [2600, 3900, 'Graduates in caps and gowns at their convocation'],
  'student-denim': [2600, 3900, 'A student in a denim shirt reading on a laptop'],
};
const photo = (n, sizes, eager = false, pos = 'center') => {
  const [w, h, alt] = PHOTOS[n];
  return `<img src="img/${n}-1600.webp" srcset="img/${n}-800.webp 800w, img/${n}-1600.webp 1600w, img/${n}-2400.webp 2400w" sizes="${sizes}" width="${w}" height="${h}" alt="${alt}" style="object-position:${pos}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
};

// ---------- copy (shared, so the designs compare layout and type only) ----------
const SIGNUP = '<a class="btn btn--primary" href="/sign-up" target="_top">Create a free account</a>';
const HOW = '<a class="btn btn--ghost" href="#how">See how it works</a>';
const NOTE = '<p class="note">1,000 free credits when you sign up. No card needed.</p>';
const H1 = 'From “what should I study?” to your first internship';
const LEAD = 'Mentora is a study platform for students in Pakistan. It matches you to a career, builds the roadmap, tests every section, runs your code against real tests and shows you internships that are still open.';

const STEPS = [
  ['Discover', 'Answer 14 questions. Get six skill scores and careers ranked by fit.'],
  ['Plan', 'Turn a career into a three-section roadmap with checked links.'],
  ['Learn and prove', 'Finish each topic, then pass a test to open the next section.'],
  ['Practise', 'Solve coding challenges that run against hidden tests.'],
  ['Build', 'Get one project idea, laid out step by step.'],
  ['Get hired', 'Earn a certificate anyone can verify and apply to open internships.'],
];

const FEATURES = [
  { id: 'discover', eyebrow: 'Career discovery', h2: 'Find careers that fit you, and see why',
    p: 'Your 14 answers become six skill scores, worked out without AI, and each strength quotes the answers behind it. Then AI ranks careers by fit, with demand, a salary range and an honest trade-off.',
    checks: ['Scores for Building, Analytical, Design, Data, Infrastructure and People', 'Fit score, demand and salary range for every career', 'Saved results you can reopen without spending credits'],
    big: 'career', crops: ['career-profile', 'career-match'] },
  { id: 'roadmap', eyebrow: 'Roadmaps', h2: 'A roadmap for that career, with links that work',
    p: 'Foundations, Intermediate and Advanced, laid out as a tree. Every resource link is checked when the roadmap is made: working links get a Verified badge and the rest become a search.',
    checks: ['Topics in order, with branches for tools and sub-skills', 'Small build tasks: finish them all to complete a topic and earn XP', 'A “you are here” marker on the next topic'],
    big: 'roadmap-topic', crops: ['roadmap-head', 'topic-panel'] },
  { id: 'tests', eyebrow: 'Milestone tests and review', h2: 'Prove each section before the next one opens',
    p: 'Every attempt is a new test: four multiple-choice questions and one short answer, graded on the server. Score 70% to unlock the next section. Topics you miss come back for review.',
    checks: ['Each wrong answer shows the right one and why', 'Missed topics return after 1, 3, 7, 14 and 30 days', 'Every review has a short lesson, a practice task and a quick check'],
    big: 'test-result', crops: ['test-result', 'review-lesson'] },
  { id: 'practice', eyebrow: 'Coding practice', h2: 'Code challenges that run against real tests',
    p: 'Pick a language, a topic and a level. Your code runs in a sandbox against visible and hidden tests, and only the tests decide whether it passed. The AI reviews your style but cannot change the result.',
    checks: ['Run checks the examples for free; Submit runs the hidden tests', '10, 25 or 50 XP the first time every test passes', 'Compile errors, timeouts and wrong answers reported separately'],
    langs: ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust'],
    big: 'challenge', crops: ['challenge'] },
];

const MORE = [
  ['tutor-drawer', 'An AI tutor on every page', 'Ask from any page and the answer streams in, with formatted code blocks.'],
  ['build-graph', 'One project worth building', 'Answer seven questions and get one project, drawn as a graph of build steps.'],
  ['progress', 'Progress you can see', 'Active study time, XP, levels, badges and a weekly leaderboard.'],
];

const FAQ = [
  ['Is Mentora free?', 'Every new account gets 1,000 credits: enough for the career test, a full roadmap and all three of its milestone tests. Reading your roadmap, reviewing topics and tracking progress never cost credits.'],
  ['Do I need to know how to code already?', 'No. Every roadmap starts with Foundations, and coding challenges come in easy, medium and hard.'],
  ['How are tests graded?', 'On the server. Correct answers never reach your browser, the short answer is marked against a hidden rubric, and code only passes when its tests pass.'],
  ['What happens if the AI fails?', 'You get clearly labelled practice content instead, and the credits for that action are refunded automatically.'],
  ['Where do the internships come from?', 'LinkedIn, pintern.net, jobz.pk, company career pages and web search. You always apply on the original listing.'],
  ['Can an employer check my certificate?', 'Yes. Anyone can scan its QR code or enter its code at /verify, without an account.'],
];

const PRICES = [
  ['Career suggestions', 50], ['Generate a roadmap', 200], ['Generate a milestone test', 60],
  ['Generate a coding challenge', 40], ['Evaluate a code submission', 30], ['Generate a project blueprint', 150], ['AI tutor message', 5],
];
// self-check: the caption's "570 left over" must stay true if prices change
console.assert(1000 - 50 - 200 - 3 * 60 === 570, 'credits caption is out of date');

// ---------- shared sections ----------
const checks = (xs) => `<ul class="checks">${xs.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const langs = (xs) => (xs ? `<ul class="chips" aria-label="Languages">${xs.map((x) => `<li>${x}</li>`).join('')}</ul>` : '');
const num = (i) => String(i + 1).padStart(2, '0');
const featText = (f, i) => `<div class="feature__text"><p class="eyebrow">${num(i)} · ${f.eyebrow}</p><h2 id="${f.id}-h">${f.h2}</h2><p class="lead">${f.p}</p>${checks(f.checks)}${langs(f.langs)}</div>`;
const featMedia = (f) => (f.crops.length === 2
  ? `<div class="pair">${card(f.crops[0], '(max-width: 600px) 100vw, 340px')}${card(f.crops[1], '(max-width: 600px) 100vw, 340px')}</div>`
  : frame(f.big, '(max-width: 960px) 100vw, 700px'));

const nav = (tone = '') => `<a class="skip" href="#main">Skip to content</a>
<header class="nav${tone ? ' nav--' + tone : ''}"><div class="wrap">
  <a class="logo" href="/" target="_top"><img src="favicon.svg" alt="" width="28" height="28">Mentora <span>AI</span></a>
  <nav class="nav__links" aria-label="Sections"><a href="#how">How it works</a><a href="#discover">Features</a><a href="#internships">Internships</a><a href="#prices">Prices</a><a href="#faq">Questions</a></nav>
  <div class="nav__end"><a class="nav__signin" href="/sign-in" target="_top">Sign in</a><a class="btn btn--primary" href="/sign-up" target="_top">Create a free account</a></div>
</div></header>`;

const stepList = () => `<ol class="steps">${STEPS.map(([t, d]) => `<li><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>`;
const steps = (band = 'paper') => `<section class="band band--${band}" id="how" aria-labelledby="how-h"><div class="wrap">
  <div class="head"><p class="eyebrow">How it works</p><h2 id="how-h">Six steps, one account</h2><p class="lead">Each step uses what the last one learned about you, from the first question to the first application.</p></div>
  ${stepList()}
</div></section>`;

const featureRows = (bands) => FEATURES.map((f, i) => `<section class="band band--${bands[i % bands.length]}" id="${f.id}" aria-labelledby="${f.id}-h"><div class="wrap">
  <div class="feature${i % 2 ? ' feature--flip' : ''}">${featText(f, i)}${featMedia(f)}</div>
</div></section>`).join('\n');

const more = (band = 'paper') => `<section class="band band--${band}" id="more" aria-labelledby="more-h"><div class="wrap">
  <div class="head"><p class="eyebrow">Also in your account</p><h2 id="more-h">Help when you are stuck, and a record of your work</h2></div>
  <div class="cards">${MORE.map(([n, t, d]) => `<article class="card"><div class="card__body"><h3>${t}</h3><p>${d}</p></div><div class="card__media">${shot(n, '(max-width: 960px) 100vw, 380px')}</div></article>`).join('')}</div>
</div></section>`;

const internships = (band = 'dark') => `<section class="band band--${band}" id="internships" aria-labelledby="internships-h"><div class="wrap">
  <div class="feature">
    <div class="feature__text"><p class="eyebrow">05 · Internships</p><h2 id="internships-h">Internships in Pakistan that are still open</h2>
      <p class="lead">Collected every 6 hours from LinkedIn, pintern.net, jobz.pk, company career pages and web search. Every listing is in Pakistan or remote, posted in the last 45 days and still taking applications.</p>
      <ul class="stats"><li><b>Every 6 hours</b><span>New listings collected</span></li><li><b>45 days</b><span>Oldest posting shown</span></li><li><b>For you</b><span>Ranked against your careers</span></li></ul>
    </div>
    ${frame('internships', '(max-width: 960px) 100vw, 700px')}
  </div>
</div></section>`;

const certificate = (band = 'paper') => `<section class="band band--${band}" id="certificate" aria-labelledby="certificate-h"><div class="wrap">
  <div class="head head--split head--top"><div><p class="eyebrow">06 · Certificate</p><h2 id="certificate-h">A certificate anyone can verify</h2></div>
    <div><p class="lead">Issued only when every topic is done and every milestone test is passed. The PDF has a QR code that opens a public page, so a recruiter can check it without an account.</p>${checks(['PDF with your name, roadmap, date and code', 'Public check at /verify, no sign-in needed', 'One link fills it in on your LinkedIn profile'])}</div></div>
  <div class="cert">${frame('verify', '(max-width: 960px) 100vw, 700px')}<div class="photo">${photo('graduates', '(max-width: 960px) 100vw, 480px', false, 'center 30%')}</div></div>
</div></section>`;

const prices = (band = 'cream') => `<section class="band band--${band}" id="prices" aria-labelledby="prices-h"><div class="wrap">
  <div class="prices">
    <div><p class="eyebrow">Prices</p><h2 id="prices-h">Pay only for AI work</h2><p class="lead">Reading your roadmap, reviewing topics and tracking progress are free. If the AI fails, the credits come back automatically.</p>
      <p class="big">1,000<small>free credits for every new account</small></p></div>
    <table class="table"><caption>1,000 credits covers the career test, a roadmap and its three milestone tests, with 570 left over.</caption>
      <thead><tr><th scope="col">Action</th><th scope="col">Credits</th></tr></thead>
      <tbody>${PRICES.map(([a, c]) => `<tr><td>${a}</td><td>${c}</td></tr>`).join('')}</tbody></table>
  </div>
</div></section>`;

const faq = (band = 'paper') => `<section class="band band--${band}" id="faq" aria-labelledby="faq-h"><div class="wrap">
  <div class="faq"><div><p class="eyebrow">Questions</p><h2 id="faq-h">Questions students ask</h2></div>
    <div>${FAQ.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div>
</div></section>`;

const START_H = 'Start with the 14-question career test';
const START_P = 'It costs 50 of your 1,000 free credits, and your results stay saved.';
const cta = (band = 'cream', img = 'campus-books') => `<section class="band band--${band}" id="start" aria-labelledby="start-h"><div class="wrap">
  <div class="cta"><div><h2 id="start-h">${START_H}</h2><p class="lead">${START_P}</p><div class="btns">${SIGNUP}</div></div>
    <div class="photo">${photo(img, '(max-width: 960px) 100vw, 560px', false, 'center 35%')}</div></div>
</div></section>`;

const footer = () => `<footer class="footer"><div class="wrap">
  <div class="footer__grid">
    <div><a class="logo" href="/" target="_top"><img src="favicon.svg" alt="" width="28" height="28">Mentora <span>AI</span></a><p>From a career test to your first internship, built for students in Pakistan.</p></div>
    <div><h3>Product</h3><ul><li><a href="#discover">Career test</a></li><li><a href="#roadmap">Roadmaps</a></li><li><a href="#practice">Practice</a></li><li><a href="#internships">Internships</a></li></ul></div>
    <div><h3>Account</h3><ul><li><a href="/sign-up" target="_top">Create an account</a></li><li><a href="/sign-in" target="_top">Sign in</a></li><li><a href="/verify" target="_top">Verify a certificate</a></li></ul></div>
    <div><h3>Help</h3><ul><li><a href="#prices">Prices</a></li><li><a href="#faq">Questions</a></li><li><a href="credits.html">Photo credits</a></li></ul></div>
  </div>
  <div class="footer__base"><span>© 2026 Mentora AI</span><span>Photos from Unsplash</span></div>
</div></footer>`;

// cards whose anchors the nav and footer use: the first card carries #discover, so the section gets #features
const featureCards = (mediaFor, sizes) => FEATURES.map((f, i) => `<article class="card" id="${f.id}"><div class="card__body"><p class="eyebrow">${num(i)} · ${f.eyebrow}</p><h3>${f.h2}</h3><p>${f.p}</p>${langs(f.langs)}</div><div class="card__media">${shot(mediaFor[f.id], sizes)}</div></article>`).join('');

// ---------- the five designs ----------
const FONTS = {
  1: ['Inter+Tight:wght@400;500;600;700', "'Inter Tight', system-ui, sans-serif", null],
  2: ['Manrope:wght@400;500;600;700;800', "'Manrope', system-ui, sans-serif", null],
  3: ['Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700', "'Inter', system-ui, sans-serif", "'Fraunces', Georgia, serif"],
  4: ['Space+Grotesk:wght@400;500;600;700', "'Space Grotesk', system-ui, sans-serif", null],
  5: ['DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700', "'DM Sans', system-ui, sans-serif", null],
};

const V = {
  1: { name: 'Split', css: `
.hero1 { padding: 72px 0 104px; }
.hero1 .wrap { display: grid; grid-template-columns: 11fr 10fr; gap: 64px; align-items: center; }
.hero1__media { position: relative; padding: 0 0 48px 48px; }
.hero1__photo { aspect-ratio: 5 / 6; border-radius: 20px; overflow: hidden; background: var(--soft); }
.hero1__photo img { width: 100%; height: 100%; object-fit: cover; }
.hero1__card { position: absolute; left: 0; bottom: 0; width: min(360px, 78%); }
@media (max-width: 960px) { .hero1 .wrap { grid-template-columns: 1fr; gap: 48px; } .hero1__media { padding: 0 0 40px 20px; } .hero1__photo { aspect-ratio: 4 / 3; } }`,
    body: () => `${nav()}
<main id="main">
<section class="hero1" aria-labelledby="hero-h"><div class="wrap">
  <div><p class="eyebrow">For students in Pakistan</p><h1 id="hero-h">${H1}</h1><p class="lead">${LEAD}</p><div class="btns">${SIGNUP}${HOW}</div>${NOTE}</div>
  <div class="hero1__media"><div class="hero1__photo">${photo('student-laptop', '(max-width: 960px) 100vw, 560px', true, '38% center')}</div><div class="hero1__card">${card('test-score', '360px')}</div></div>
</div></section>
${steps('paper')}
${featureRows(['cream', 'paper'])}
${internships('dark')}
${certificate('paper')}
${more('cream')}
${prices('paper')}
${faq('cream')}
${cta('paper')}
</main>
${footer()}` },

  2: { name: 'Product', css: `
.hero2 { padding: 88px 0 0; }
.hero2 h1 { max-width: 15ch; margin-inline: auto; }
.hero2__shot { margin-top: 64px; }
.hero2__shot .frame { border-bottom: 0; border-radius: 16px 16px 0 0; box-shadow: none; }
.big-feature .head { margin-bottom: 48px; }
.pair--narrow { max-width: 980px; margin-inline: auto; }`,
    body: () => `${nav()}
<main id="main">
<section class="hero2" aria-labelledby="hero-h"><div class="wrap">
  <div class="head head--center" style="margin-bottom:0"><p class="eyebrow">For students in Pakistan</p><h1 id="hero-h">${H1}</h1><p class="lead">${LEAD}</p><div class="btns">${SIGNUP}${HOW}</div>${NOTE}</div>
  <div class="hero2__shot">${frame('career', '(max-width: 1248px) 100vw, 1200px', true)}</div>
</div></section>
${steps('paper')}
${FEATURES.map((f, i) => `<section class="band band--${i % 2 ? 'paper' : 'cream'}" id="${f.id}" aria-labelledby="${f.id}-h"><div class="wrap big-feature">
  <div class="head head--split"><div><p class="eyebrow">${num(i)} · ${f.eyebrow}</p><h2 id="${f.id}-h">${f.h2}</h2></div><div><p class="lead">${f.p}</p>${langs(f.langs)}</div></div>
  ${f.crops.length === 2 && f.id !== 'roadmap' ? `<div class="pair pair--narrow">${card(f.crops[0], '(max-width: 600px) 100vw, 480px')}${card(f.crops[1], '(max-width: 600px) 100vw, 480px')}</div>` : frame(f.big, '(max-width: 1248px) 100vw, 1200px')}
</div></section>`).join('\n')}
${internships('dark')}
${certificate('cream')}
${more('paper')}
${prices('cream')}
${faq('paper')}
${cta('cream', 'campus-bench-2')}
</main>
${footer()}` },

  3: { name: 'Campus', css: `
:root { --display-weight: 500; }
h1, h2 { letter-spacing: -.02em; }
.hero3 { position: relative; display: flex; align-items: flex-end; min-height: min(88vh, 800px); padding-top: 56px; }
.hero3__img { position: absolute; inset: 0; background: var(--soft); }
.hero3__img img { width: 100%; height: 100%; object-fit: cover; }
.hero3 .wrap { width: 100%; }
.hero3__panel { position: relative; max-width: 560px; margin-left: auto; margin-bottom: 56px; padding: 48px; border-radius: 20px; background: var(--bg); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.grid2 .card__media { height: 370px; }
.grid2 .card__body h3 { font-size: 28px; font-weight: 500; }
@media (max-width: 960px) {
  .hero3 { display: block; min-height: 0; padding-top: 0; }
  .hero3__img { position: relative; aspect-ratio: 4 / 3; }
  .hero3__panel { margin: -48px 0 0; padding: 32px 24px; }
  .grid2 { grid-template-columns: 1fr; }
  .grid2 .card__media { height: 300px; }
}`,
    body: () => `${nav()}
<main id="main">
<section class="hero3" aria-labelledby="hero-h">
  <div class="hero3__img">${photo('campus-bench', '100vw', true, 'center 45%')}</div>
  <div class="wrap"><div class="hero3__panel"><p class="eyebrow">For students in Pakistan</p><h1 id="hero-h">${H1}</h1><p class="lead">${LEAD}</p><div class="btns">${SIGNUP}${HOW}</div>${NOTE}</div></div>
</section>
${steps('paper')}
<section class="band band--cream" id="features" aria-labelledby="features-h"><div class="wrap">
  <div class="head"><p class="eyebrow">Inside Mentora</p><h2 id="features-h">Four tools that check your work</h2><p class="lead">Each one picks up where the last one stopped, in the same account.</p></div>
  <div class="grid2">${featureCards({ discover: 'career', roadmap: 'roadmap-topic', tests: 'test-result', practice: 'challenge' }, '(max-width: 960px) 100vw, 590px')}</div>
</div></section>
${internships('dark')}
${certificate('paper')}
${more('cream')}
${prices('paper')}
${faq('cream')}
${cta('paper', 'campus-books')}
</main>
${footer()}` },

  4: { name: 'Dark', css: `
.hero4 { padding: 80px 0 96px; }
.hero4 h1 span { color: var(--orange); }
.hero4__steps { margin-top: 96px; }`,
    body: () => `${nav('dark')}
<main id="main">
<section class="hero4 band--dark" aria-labelledby="hero-h"><div class="wrap">
  <div class="feature"><div><p class="eyebrow">For students in Pakistan</p><h1 id="hero-h">From “what should I study?” to <span>your first internship</span></h1><p class="lead">${LEAD}</p><div class="btns">${SIGNUP}${HOW}</div>${NOTE}</div>
    ${frame('challenge', '(max-width: 960px) 100vw, 700px', true)}</div>
  <div class="hero4__steps" id="how"><h2 id="how-h" class="skip">How it works</h2>${stepList()}</div>
</div></section>
${featureRows(['cream', 'paper'])}
${internships('dark')}
${certificate('cream')}
${more('paper')}
${prices('cream')}
${faq('paper')}
<section class="band band--orange" id="start" aria-labelledby="start-h"><div class="wrap">
  <div class="head" style="margin-bottom:0"><h2 id="start-h">${START_H}</h2><p class="lead">${START_P}</p><div class="btns">${SIGNUP}</div></div>
</div></section>
</main>
${footer()}` },

  5: { name: 'Bento', css: `
.hero5 { padding: 80px 0 104px; background: var(--paper); }
.hero5 .head { max-width: 860px; margin-bottom: 56px; }
.bento { display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 220px; gap: 20px; }
.tile { position: relative; overflow: hidden; border: 1px solid var(--line); border-radius: 18px; background: var(--bg); }
.tile img { width: 100%; height: 100%; object-fit: cover; object-position: top left; }
.tile--tall { grid-row: span 2; }
.tile--centre img { object-position: top center; }
.tile--big { grid-column: span 2; grid-row: span 2; }
.tile__label { position: absolute; left: 14px; bottom: 14px; padding: 6px 12px; border-radius: 999px; background: var(--ink); color: #ffffff; font-size: 13px; font-weight: 600; }
.fbento { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; }
.fbento .card:nth-child(4n + 1), .fbento .card:nth-child(4n) { grid-column: span 3; }
.fbento .card:nth-child(4n + 2), .fbento .card:nth-child(4n + 3) { grid-column: span 2; }
.fbento .card__media { height: 340px; }
@media (max-width: 960px) {
  .bento { grid-template-columns: 1fr 1fr; grid-auto-rows: 200px; grid-auto-flow: dense; }
  .tile--big { grid-column: span 2; }
  .fbento { grid-template-columns: 1fr; }
  .fbento .card:nth-child(n) { grid-column: auto; }
}
@media (max-width: 600px) { .bento { grid-auto-rows: 160px; gap: 12px; } }`,
    body: () => {
      const tile = (n, cls, label) => `<div class="tile ${cls}">${shot(n, '(max-width: 960px) 50vw, 300px', true)}<span class="tile__label">${label}</span></div>`;
      return `${nav('paper')}
<main id="main">
<section class="hero5" aria-labelledby="hero-h"><div class="wrap">
  <div class="head"><p class="eyebrow">For students in Pakistan</p><h1 id="hero-h">${H1}</h1><p class="lead">${LEAD}</p><div class="btns">${SIGNUP}${HOW}</div>${NOTE}</div>
  <div class="bento" role="group" aria-label="Screens from Mentora">
    ${tile('career-profile', 'tile--tall', 'Career test')}${tile('roadmap-tree', 'tile--big', 'Roadmap')}${tile('verify', 'tile--tall tile--centre', 'Certificate')}
  </div>
</div></section>
${steps('cream')}
<section class="band band--paper" id="features" aria-labelledby="features-h"><div class="wrap">
  <div class="head head--split"><div><p class="eyebrow">Inside Mentora</p><h2 id="features-h">Four tools that check your work</h2></div><p class="lead">Each one picks up where the last one stopped, in the same account.</p></div>
  <div class="fbento">${featureCards({ discover: 'career', roadmap: 'topic-panel', tests: 'test-result', practice: 'challenge' }, '(max-width: 960px) 100vw, 720px')}</div>
</div></section>
${internships('dark')}
${certificate('cream')}
${more('paper')}
${prices('cream')}
${faq('paper')}
${cta('cream', 'campus-bench-2')}
</main>
${footer()}`;
    } },
};

const page = (n) => {
  const v = V[n];
  const [fam, font, display] = FONTS[n];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mentora AI · Career roadmaps and internships for students in Pakistan</title>
<meta name="description" content="A career test, a roadmap with checked links, milestone tests, real coding practice, a verifiable certificate and open internships, built for students in Pakistan.">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${fam}&display=swap">
<link rel="stylesheet" href="landing.css">
<style>
:root { --font: ${font}; --display: ${display || 'var(--font)'}; }
${v.css}
</style>
</head>
<body>
${v.body()}
</body>
</html>
`;
};

for (const n of [1, 2, 3, 4, 5]) {
  fs.writeFileSync(path.join(OUT, `v${n}.html`), page(n));
  console.log(`wrote v${n}.html (${V[n].name})`);
}
