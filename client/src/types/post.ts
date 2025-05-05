export interface Community {
    id: string | number;
    name: string;
    photo?: string;
    username?: string;
    type?: string;
}

export interface Post {
    id: string | number;
    platform: 'vk' | 'tg';
    text: string;
    date: number;
    views: number;
    likes: number;
    reposts: number;
    comments: number;
    forwards: number;
    attachments?: Array<{
        type: string;
        url: string;
    }>;
    media?: string[];
    type: string;
    isPinned?: boolean;
    isAd?: boolean;
    community: Community;
    channelId?: string | number;
}

export interface PostsResponse {
    total: number;
    posts: Post[];
} 