export interface Session {
    id: string;
    create_time: Date;
    update_time: Date;
    title: string;
}

export interface SessionCreate {
    user_id: string;
    session_id: string;
}
