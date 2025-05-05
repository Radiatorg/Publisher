import { PostsResponse } from '../types/post';
import { api } from '../api/api';

export const postsApi = {
    getAllPosts: async (): Promise<PostsResponse> => {
        const response = await api.get('/accounts/posts');
        return response.data;
    }
}; 