export interface Community {
    id: string;
    name: string;
    photo: string;
    type: string;
}

export interface Account {
    id: number;
    user_id: number;
    platform_id: number;
    account_sn_id: string;
    access_token: string;
    refresh_token?: string;
    created_at: string;
    updated_at: string;
    platform?: {
        id: number;
        name: string;
    };
    vkData?: {
        name: string;
        photo: string;
    };
    telegramData?: {
        name: string;
        photo: string;
    };
    communities?: Community[];
    channels?: Community[];
} 