import React from 'react';
import ReactMarkdown from 'react-markdown';

export const MarkdownPart: React.FC<{ markdown: string }> = ({ markdown }) => (
  <div className="prose prose-sm prose-invert max-w-none text-left">
    <ReactMarkdown
      components={{
        // Custom link styling
        a: (props) => (
          <a
            {...props}
            className="text-blue-400 hover:text-blue-300 underline transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          />
        ),
        // Custom paragraph styling
        p: (props) => (
          <p {...props} className="mb-2 last:mb-0 text-left text-gray-200" />
        ),
        // Custom list styling
        ul: (props) => (
          <ul {...props} className="list-disc list-outside ml-4 space-y-1 text-gray-200" />
        ),
        ol: (props) => (
          <ol {...props} className="list-decimal list-outside ml-4 space-y-1 text-gray-200" />
        ),
        li: (props) => (
          <li {...props} className="text-gray-200" />
        ),
        // Custom code styling
        code: (props) => (
          <code {...props} className="bg-gray-700 px-1 py-0.5 rounded text-sm text-gray-100" />
        ),
        // Custom pre styling for code blocks
        pre: (props) => (
          <pre {...props} className="bg-gray-800 p-3 rounded-md overflow-x-auto border border-gray-700" />
        ),
        // Custom strong styling for bold text
        strong: (props) => (
          <strong {...props} className="font-semibold text-white" />
        ),
        // Custom em styling for italic text
        em: (props) => (
          <em {...props} className="italic text-gray-100" />
        ),
        // Custom heading styles
        h1: (props) => (
          <h1 {...props} className="text-xl font-bold text-white mb-2" />
        ),
        h2: (props) => (
          <h2 {...props} className="text-lg font-semibold text-white mb-2" />
        ),
        h3: (props) => (
          <h3 {...props} className="text-base font-medium text-white mb-2" />
        ),
        // Custom blockquote styling
        blockquote: (props) => (
          <blockquote {...props} className="border-l-4 border-gray-600 pl-4 italic text-gray-300" />
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  </div>
);
