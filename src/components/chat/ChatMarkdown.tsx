"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// No rehype-raw: raw HTML in model output is never rendered, and
// react-markdown's default urlTransform drops javascript: style links.
const components: Components = {
  p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-1.5 list-disc space-y-0.5 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 list-decimal space-y-0.5 pl-5">{children}</ol>,
  h1: ({ children }) => <p className="mb-1 mt-2 text-[14px] font-semibold">{children}</p>,
  h2: ({ children }) => <p className="mb-1 mt-2 text-[14px] font-semibold">{children}</p>,
  h3: ({ children }) => <p className="mb-1 mt-2 font-semibold">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="text-[#ff5600] underline underline-offset-2">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-1.5 border-l-2 border-[#d3cec6] pl-3 text-[#626260]">{children}</blockquote>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-[8px] bg-[#111111] px-3 py-2.5 font-mono text-[12px] leading-[1.5] text-white">
      {children}
    </pre>
  ),
  code: ({ className, children }) =>
    // Fenced blocks carry a language-* class (or sit inside <pre>, styled above); bare code is inline.
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded-[4px] bg-[#ebe7e1] px-1 py-px font-mono text-[12px] text-[#111111] [pre_&]:bg-transparent [pre_&]:p-0 [pre_&]:text-white">
        {children}
      </code>
    ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-[#d3cec6] bg-[#f5f1ec] px-2 py-1 text-left font-medium">{children}</th>,
  td: ({ children }) => <td className="border border-[#d3cec6] px-2 py-1">{children}</td>,
};

export function ChatMarkdown({ children }: { children: string }) {
  return (
    <div className="break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
