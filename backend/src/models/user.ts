import type { Role } from "@shared/types/roles.js";

interface User {
    id: number;
    username: string;
    hashedPassword: string;
    token: string;
    role: Role;
    date_created: Date;
};
export default User;