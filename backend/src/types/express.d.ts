import { user } from "../services/userService.ts";

declare global {
    namespace Express {
        interface Request {
            user?: user;
        }
    }
}
