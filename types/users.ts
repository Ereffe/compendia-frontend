export type UserRole = "USER" | "PROFESSOR" | "ADMIN";

export type AccountUser = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
};
