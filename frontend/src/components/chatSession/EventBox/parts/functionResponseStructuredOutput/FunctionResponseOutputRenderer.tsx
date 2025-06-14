import React from 'react';
import { ResultWithReferencesResponse, isResultWithReferences } from './resultWithReferencesResponse';

interface FunctionResponseOutputRendererProps {
  response: string | Record<string, any> | null;
}

export const FunctionResponseOutputRenderer: React.FC<FunctionResponseOutputRendererProps> = ({ response }) => {
  if (!response) return null;

  // Check for ResultWithReferences
  if (isResultWithReferences(response)) {
    return <ResultWithReferencesResponse data={response} />;
  }

  // Add more type checks here for future structured output types
  // Example:
  // if (isAnotherStructuredType(response)) {
  //   return <AnotherStructuredTypeResponse data={response} />;
  // }

  // Default JSON rendering for unrecognized types
  return (
    <pre className="text-green-300 text-sm overflow-x-auto">
      {JSON.stringify(response, null, 2)}
    </pre>
  );
};
