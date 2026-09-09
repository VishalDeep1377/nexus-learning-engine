'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useState } from 'react';

interface MarkdownMessageProps {
  content: string;
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all duration-200"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
};

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Code blocks
        code({ node, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');
          const isBlock = !!match || codeString.includes('\n');

          if (isBlock) {
            return (
              <div className="relative my-3 rounded-xl overflow-hidden border border-white/10">
                {/* Language badge */}
                <div className="flex items-center justify-between px-4 py-2 bg-[#1a1f2e] border-b border-white/10">
                  <span className="text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                    {match ? match[1] : 'code'}
                  </span>
                  <CopyButton text={codeString} />
                </div>
                <SyntaxHighlighter
                  style={oneDark as any}
                  language={match ? match[1] : 'text'}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    background: '#0d1117',
                    fontSize: '13.5px',
                    lineHeight: '1.6',
                    padding: '16px',
                  }}
                  showLineNumbers={codeString.split('\n').length > 5}
                  {...props}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          }

          // Inline code
          return (
            <code
              className="px-1.5 py-0.5 rounded text-[13px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
              {...props}
            >
              {children}
            </code>
          );
        },

        // Headings
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-white mt-4 mb-2 border-b border-white/10 pb-1">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold text-white mt-4 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-indigo-300 mt-3 mb-1">{children}</h3>
        ),

        // Paragraph
        p: ({ children }) => (
          <p className="text-[14.5px] text-gray-200 leading-7 mb-3 last:mb-0">{children}</p>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="my-2 ml-4 space-y-1 list-none">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-2 ml-4 space-y-1 list-decimal list-inside">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="flex items-start gap-2 text-[14px] text-gray-200 leading-6">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
            <span>{children}</span>
          </li>
        ),

        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="my-3 pl-4 border-l-2 border-indigo-500 bg-indigo-500/5 py-2 pr-3 rounded-r-lg">
            <div className="text-[14px] text-gray-300 italic">{children}</div>
          </blockquote>
        ),

        // Strong / Em
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-300">{children}</em>
        ),

        // Table
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-white/5 text-gray-300 uppercase text-xs tracking-wider">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-white/5">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-white/3 transition-colors">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 text-left text-gray-400 font-semibold">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 text-gray-300">{children}</td>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
          >
            {children} ↗
          </a>
        ),

        // Horizontal rule
        hr: () => <hr className="my-4 border-white/10" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
