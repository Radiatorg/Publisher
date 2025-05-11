export interface Community {
    id: string;
    name: string;
    photo: string;
    type: string;
    platform: 'vk' | 'telegram';
    accountId: string;
}

export interface Post {
    id: string;
    platform: 'vk' | 'telegram';
    text: string;
    date: number;
    likes?: number;
    reposts?: number;
    views?: number;
    comments?: number;
    forwards?: number;
    attachments?: any[];
    isPinned?: boolean;
    isAd?: boolean;
    type: 'post';
    community: Community;
}

export interface PostsResponse {
    total: number;
    posts: Post[];
} 