export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly LOGIN: "/auth/login";
        readonly REGISTER: "/auth/register";
        readonly REFRESH: "/auth/refresh";
        readonly LOGOUT: "/auth/logout";
    };
    readonly USERS: {
        readonly GET_ALL: "/users";
        readonly GET_BY_ID: "/users/:id";
        readonly CREATE: "/users";
        readonly UPDATE: "/users/:id";
        readonly DELETE: "/users/:id";
    };
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly INTERNAL_SERVER_ERROR: 500;
};
export declare const DEFAULT_PAGINATION: {
    readonly PAGE: 1;
    readonly LIMIT: 10;
    readonly MAX_LIMIT: 100;
};
