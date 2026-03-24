import type { baseResponse } from "./baseApi.js";
export interface loginBody {
    username: string;
    password: string;
};
export interface loginResponse extends baseResponse {
    token?: string;
};
export interface registerBody {
    username: string;
    password: string;
    confirmPassword: string;
};
export interface registerResponse extends baseResponse {
    token?: string;
};
export interface verifyTokenBody {
    token: string;
};