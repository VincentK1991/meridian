export enum Orchestration {
    SEQUENTIAL = "sequential",
    PARALLEL = "parallel",
    DEEP_RESEARCH = "deep_research",
    TRIAGE = "triage",
}

export interface ConversationRequest {
    user_input: string;
    agents: string[] | null;
    orchestration_strategy: Orchestration;
}
