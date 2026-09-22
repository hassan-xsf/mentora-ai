/**
 * Self-check that a node card's three stacked rows fit inside CARD_H.
 *
 * The card is a flex column (title / detail / badges), so this guards the one
 * thing flexbox cannot: that CARD_H leaves enough room for the content at its
 * real line heights. When it did not, the badge row overlapped the detail text.
 *
 * Run: npx tsx src/lib/blueprints/card-fit.test.ts
 */
import assert from "node:assert/strict";
import { CARD_H, CARD_W } from "./layout";

// Mirrors the Tailwind classes on the card in BlueprintGraph.tsx.
const PAD_Y = 12 * 2; // p-3 top + bottom

const TITLE_LINES = 2; // line-clamp-2
const TITLE_LINE = 12.5 * 1.25; // text-[12.5px] leading-tight

const DETAIL_MT = 4; // mt-1
const DETAIL_LINES = 2; // line-clamp-2
const DETAIL_LINE = 10.5 * 1.625; // text-[10.5px] leading-relaxed

const BADGE_PT = 6; // pt-1.5
const BADGE_H = 9 * 1.25 + 2 * 2; // text-[9px] badge + py-0.5

const contentH =
  PAD_Y +
  TITLE_LINES * TITLE_LINE +
  DETAIL_MT +
  DETAIL_LINES * DETAIL_LINE +
  BADGE_PT +
  BADGE_H;

assert.ok(
  contentH <= CARD_H,
  `card content ${contentH.toFixed(1)}px exceeds CARD_H ${CARD_H}px — badges will overlap the detail text`
);

// Guard against over-correcting into a card that is mostly empty space.
assert.ok(
  CARD_H - contentH < 30,
  `CARD_H ${CARD_H}px leaves ${(CARD_H - contentH).toFixed(1)}px of dead space`
);

// A 3-word title at 12.5px semibold must not need a third clamped line in
// CARD_W; ~6.2px average advance is a safe estimate for this weight/size.
const usableW = CARD_W - 12 * 2 - 6 /* stripe pl-1.5 */ - 16 - 8 /* checkbox + gap */;
assert.ok(usableW / 6.2 >= 18, `only ~${Math.floor(usableW / 6.2)} chars per title line`);

console.log(
  `card fit self-check passed (content ${contentH.toFixed(1)}px in ${CARD_H}px)`
);
