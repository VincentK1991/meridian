export interface ParagraphWithReference {
    content: string;
    reference: string;
}

export interface SearchResultWithReferences {
    paragraphs: ParagraphWithReference[];
    summary: string;
    sources: string[];
}

export interface ResultWithReferences {
    result: SearchResultWithReferences;
}
