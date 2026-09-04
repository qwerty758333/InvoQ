"use client";

import { useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders an AI-generated compliance explanation as styled UI.
 *
 * Safety: react-markdown only produces React elements — raw HTML in the model
 * output is NOT rendered (no dangerouslySetInnerHTML, no rehype-raw), and
 * remark-gfm adds table/strikethrough/task-list support. Works identically
 * for English, Sinhala, and Tamil content.
 */

/**
 * Map an unknown explanation value to renderable Markdown source.
 * Anything that is not a non-empty string (null, undefined, objects,
 * arrays, numbers) falls back to the "No explanation available." state.
 */
function toMarkdownSource(content: unknown): string | null {
  if (typeof content !== "string") return null;
  const trimmed = content.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Element mapping styled with InvoQ's existing design tokens. */
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-5 mb-2 text-lg font-bold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 mb-2 text-base font-semibold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-1.5 text-sm font-semibold first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-3 mb-1 text-sm font-semibold first:mt-0">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="mt-3 mb-1 text-sm font-semibold first:mt-0">{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className="mt-3 mb-1 text-sm font-semibold first:mt-0">{children}</h6>
  ),
  p: ({ children }) => (
    <p className="my-2.5 leading-relaxed first:mt-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1.5 pl-6">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-6">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed [&>p]:my-1">{children}</li>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through">{children}</del>,
  hr: () => <hr className="my-6 border-border" />,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="break-words text-primary underline underline-offset-2"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-muted py-1 pl-4 text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y">{children}</tbody>,
  th: ({ children }) => (
    <th className="border-b px-4 py-2.5 text-left font-semibold whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 align-top">{children}</td>
  ),
  // AI explanations must not embed remote images
  img: () => null,
};

export function MarkdownExplanation({ content }: { content: unknown }) {
  const source = toMarkdownSource(content);

  // Parse the Markdown once per content change instead of on every re-render.
  const rendered = useMemo(() => {
    if (source === null) return null;
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {source}
      </ReactMarkdown>
    );
  }, [source]);

  if (rendered === null) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No explanation available.
      </p>
    );
  }

  return <div className="text-sm">{rendered}</div>;
}
