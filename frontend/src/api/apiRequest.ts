import { API_MESSAGES } from "@shared/constants/messages.js";
import type { baseResponse } from "@shared/types/api/baseApi.js";
import { apiHelper } from "./apiHelper";

type ErrorHandler = (message: string) => void;

export function createApiReader(onError: ErrorHandler) {
    const lireGet = async <T extends baseResponse>(url: string): Promise<T | null> => {
        const response = await apiHelper.get<T>(url);
        if (response.error) {
            onError(response.error);
            return null;
        }

        const data = response.data;
        if (!data) {
            onError(API_MESSAGES.INVALID_SERVER_RESPONSE);
            return null;
        }
        return data;
    };

    const lirePost = async <Req, Res extends baseResponse>(url: string, payload: Req): Promise<Res | null> => {
        const response = await apiHelper.post<Req, Res>(url, payload);
        if (response.error) {
            onError(response.error);
            return null;
        }

        const data = response.data;
        if (!data) {
            onError(API_MESSAGES.INVALID_SERVER_RESPONSE);
            return null;
        }
        return data;
    };

    return { lireGet, lirePost };
}
