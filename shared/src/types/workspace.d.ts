export interface WorkspaceFile {
    path: string;
    filename: string;
    workspace: string;
    line: number;
}
export interface WorkspaceGroup {
    workspace: string;
    files: WorkspaceFile[];
    count: number;
}
export interface WorkspaceQuery {
    limit?: number;
    include_hidden?: boolean;
    file_types?: string[];
}
export interface WorkspaceResponse {
    success: boolean;
    data: {
        workspaces: WorkspaceGroup[];
        total_workspaces: number;
        total_files: number;
    };
    message?: string;
}
