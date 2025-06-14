import React from 'react';

export const TextPart: React.FC<{ text: string }> = ({ text }) => (
  <div className="prose prose-sm max-w-none">
    <p className="mb-0 whitespace-pre-wrap">{text}</p>
  </div>
);
