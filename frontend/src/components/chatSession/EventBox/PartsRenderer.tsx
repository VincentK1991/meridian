import React from 'react';
import type { PartsModel } from '@/types/event';
import { TextPart, FunctionCallPart, FunctionResponsePart, CodeExecutionPart, CodeExecutionResultPart } from './parts';

export const PartsRenderer: React.FC<{ parts: PartsModel[] }> = ({ parts }) => (
  <div className="space-y-2">
    {parts.map((part, index) => (
      <div key={index}>
        {part.text && <TextPart text={part.text} />}
        {part.function_call && <FunctionCallPart functionCall={part.function_call} />}
        {part.function_response && <FunctionResponsePart functionResponse={part.function_response} />}
        {part.executable_code && <CodeExecutionPart codeExecution={part.executable_code} />}
        {part.code_execution_result && <CodeExecutionResultPart result={part.code_execution_result} />}
      </div>
    ))}
  </div>
);
