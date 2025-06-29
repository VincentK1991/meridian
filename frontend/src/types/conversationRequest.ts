export enum Orchestration {
    SEQUENTIAL = "sequential",
    PARALLEL = "parallel",
    DEEP_RESEARCH = "deep_research",
}

export interface ConversationRequest {
    user_input: string;
    agents: string[] | null;
    orchestration: Orchestration | null;
}
