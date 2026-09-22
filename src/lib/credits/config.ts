/**
 * Credits pricing — single source of truth. Hardcoded on purpose for now;
 * move to the DB when prices need to change without a deploy.
 */

export const SIGNUP_BONUS_CREDITS = 1000;

/** What each AI-backed action costs. Keys double as `credit_transactions.reason`. */
export const CREDIT_COSTS = {
  career_suggestions: 50,
  generate_roadmap: 200,
  generate_challenge: 40,
  evaluate_submission: 30,
  generate_milestone_test: 60,
  generate_blueprint: 150,
  chat_message: 5,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

/** Human labels for the pricing table and the "not enough credits" copy. */
export const CREDIT_ACTION_LABELS: Record<CreditAction, string> = {
  career_suggestions: "Career suggestions",
  generate_roadmap: "Generate a roadmap",
  generate_challenge: "Generate a coding challenge",
  evaluate_submission: "Evaluate a code submission",
  generate_milestone_test: "Generate a milestone test",
  generate_blueprint: "Generate a project blueprint",
  chat_message: "AI tutor message",
};

export type CreditPack = {
  id: string;
  name: string;
  credits: number;
  /** Price in USD cents. No payment provider wired up yet. */
  priceCents: number;
  /** Bonus credits on top of `credits`, shown as the reason to buy bigger. */
  bonus: number;
  popular?: boolean;
};

export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter", credits: 1000, priceCents: 500, bonus: 0 },
  { id: "student", name: "Student", credits: 5000, priceCents: 2000, bonus: 500, popular: true },
  { id: "pro", name: "Pro", credits: 15000, priceCents: 5000, bonus: 2500 },
];

export function getPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

/** Total credits a pack actually delivers. */
export function packTotal(pack: CreditPack): number {
  return pack.credits + pack.bonus;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
