import type { baseResponse } from "./baseApi.js";
import type { Role } from "../roles.js";
export interface loginBody {
    username: string;
    password: string;
};
export interface loginResponse extends baseResponse {
    token?: string;
    role?: Role;
    username?: string;
};
export interface registerBody {
    username: string;
    password: string;
    confirmPassword: string;
};
export interface registerResponse extends baseResponse {
    token?: string;
    role?: Role;
    username?: string;
};
export interface verifyTokenBody {
    token: string;
};
export interface verifyTokenResponse extends baseResponse {
    role?: Role;
    username?: string;
};