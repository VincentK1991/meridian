import  type { ResultWithReferences } from "./structuredOutput";

export enum EventRole {
    USER = "user",
    MODEL = "model"
}

export interface FunctionCallModel {
    id: string;
    name: string;
    args: string | Record<string, any>;
}

export interface FunctionResponseModel {
    id: string;
    name: string;
    response?: string | Record<string, any> | ResultWithReferences | null;
}

export interface CodeExecutionModel {
    code: string;
    language: string;
}

export interface CodeExecutionResultModel {
    output: string;
    outcome: string;
}

export interface PartsModel {
    text?: string | null;
    function_response?: FunctionResponseModel | null;
    function_call?: FunctionCallModel | null;
    executable_code?: CodeExecutionModel | null;
    code_execution_result?: CodeExecutionResultModel | null;
}

export interface ContentModel {
    role: EventRole;
    parts: PartsModel[];
}

// Grounding Metadata Types
export interface WebInfo {
    domain?: string | null;
    title?: string | null;
    uri?: string | null;
}

export interface GroundingChunk {
    retrieved_context?: string | null;
    web?: WebInfo | null;
}

export interface Segment {
    end_index: number;
    part_index?: number | null;
    start_index: number;
    text: string;
}

export interface GroundingSupport {
    confidence_scores: number[];
    grounding_chunk_indices: number[];
    segment: Segment;
}

export interface RetrievalMetadata {
    google_search_dynamic_retrieval_score?: number | null;
}

export interface SearchEntryPoint {
    rendered_content?: string | Record<string, any> | null;
    sdk_blob?: string | null;
}

export interface GroundingMetadata {
    grounding_chunks?: GroundingChunk[] | null;
    grounding_supports?: GroundingSupport[] | null;
    retrieval_metadata?: RetrievalMetadata | null;
    retrieval_queries?: string | null;
    search_entry_point?: SearchEntryPoint | null;
    web_search_queries?: string[] | null;
}

export interface EventModel {
    id: string; // This maps to event_id in Python (using Field alias)
    user_id: string;
    session_id: string;
    invocation_id: string;
    author: string;
    branch?: string | null;
    timestamp: string; // ISO date string
    content: ContentModel;
    actions: any; // Can be various types (pickled bytes, object, string)
    grounding_metadata?: GroundingMetadata | null;
    partial?: boolean | null;
    turn_complete?: boolean | null;
    error_code?: string | null;
    error_message?: string | null;
    interrupted?: boolean | null;
}
