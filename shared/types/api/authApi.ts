import { baseResponse } from "./baseApi.js";
export interface loginBody {
    username: string;
    password: string;
};
export interface loginResponse extends baseResponse {
    token?: string;
};
export interface verifyTokenBody {
    token: string;
};