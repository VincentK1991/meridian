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
    response?: string | Record<string, any> | null;
}

export interface PartsModel {
    text?: string | null;
    function_response?: FunctionResponseModel | null;
    function_call?: FunctionCallModel | null;
}

export interface ContentModel {
    role: EventRole;
    parts: PartsModel[];
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
    grounding_metadata?: string | null;
    partial?: boolean | null;
    turn_complete?: boolean | null;
    error_code?: string | null;
    error_message?: string | null;
    interrupted?: boolean | null;
}
