export interface Session {
    id: string;
    user_id: string;
    create_time: Date;
    update_time: Date;
    title: string;
}

export interface SessionCreate {
    user_id: string;
    session_id: string;
}

export interface SessionDelete {
    session_id: string;
    message: string;
}

export interface SessionUpdate {
    title: string;
}
