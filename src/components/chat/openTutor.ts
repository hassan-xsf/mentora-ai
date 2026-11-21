// Lets any client component open the tutor drawer scoped to a roadmap node,
// e.g. an "Ask the tutor" button: openTutor({ nodeId: node.id, title: node.title }).
// The server re-checks node ownership; `title` is only the banner label.
export const OPEN_TUTOR_EVENT = "mentora:open-tutor";

export type TutorContext = { nodeId: string; title: string };

export function openTutor(ctx?: TutorContext) {
  window.dispatchEvent(new CustomEvent<TutorContext | undefined>(OPEN_TUTOR_EVENT, { detail: ctx }));
}
