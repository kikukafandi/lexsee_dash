import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-lg font-serif text-text-high font-semibold mt-4 mb-2 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-serif text-text-high font-semibold mt-4 mb-1.5 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-serif text-gold font-semibold mt-3 mb-1 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-text-high text-sm leading-relaxed mb-3 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="text-gold font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-text-med italic">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-4 mb-3 space-y-1 text-sm text-text-high">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-4 mb-3 space-y-1 text-sm text-text-high">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed pl-1">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-neutral-300 pl-3 my-3 text-text-med italic text-sm">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return (
        <code className="block bg-surface-3 border border-neutral-200 rounded-lg p-3 text-xs font-mono text-gold overflow-x-auto whitespace-pre my-3">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-surface-3 text-gold text-xs font-mono px-1.5 py-0.5 rounded">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  hr: () => <hr className="border-neutral-200 my-4" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gold underline underline-offset-2 hover:text-gold-light transition-colors"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-neutral-200">{children}</thead>,
  th: ({ children }) => (
    <th className="text-left text-gold text-xs uppercase tracking-wider py-2 pr-4 font-medium">{children}</th>
  ),
  td: ({ children }) => (
    <td className="text-text-med text-sm py-2 pr-4 border-b border-neutral-100">{children}</td>
  ),
};

interface Props {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
