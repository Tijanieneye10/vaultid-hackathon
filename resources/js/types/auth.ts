export type User = {
    id: string;
    display_name: string;
    is_wallet: boolean;
    wallet_address: string | null;
    email: string | null;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
};

export type Flash = {
    success: string | null;
    error: string | null;
};
