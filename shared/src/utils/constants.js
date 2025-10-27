"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PAGINATION = exports.HTTP_STATUS = exports.API_ENDPOINTS = void 0;
exports.API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
    },
    USERS: {
        GET_ALL: '/users',
        GET_BY_ID: '/users/:id',
        CREATE: '/users',
        UPDATE: '/users/:id',
        DELETE: '/users/:id',
    },
};
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
};
exports.DEFAULT_PAGINATION = {
    PAGE: 1,
    LIMIT: 10,
    MAX_LIMIT: 100,
};
//# sourceMappingURL=constants.js.map