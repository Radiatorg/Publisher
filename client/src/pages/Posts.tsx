import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post, Community } from '../types/post';
import { postApi } from '../api/postApi';
import { accountApi } from '../api/accountApi';
import { useAuth } from '../contexts/AuthContext';
import { CreatePostForm } from '../components/CreatePostForm';
import { SearchBar } from '../components/SearchBar';
import { PostCard } from '../components/PostCard';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';

const Posts: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
    const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchCommunities = async () => {
        try {
            const accounts = await accountApi.getAccounts();
            const allCommunities: Community[] = [];

            for (const account of accounts) {
                if (account.platform_id === 1) { // VK
                    const vkCommunities = await accountApi.getVKCommunities(account.id);
                    allCommunities.push(...vkCommunities.map(community => ({
                        id: community.id.toString(),
                        platform: 'vk' as const,
                        accountId: account.id.toString(),
                        photo: community.photo || '',
                        name: community.name || 'Unnamed Community',
                        type: 'group'
                    })));
                } else if (account.platform_id === 2) { // Telegram
                    const telegramData = JSON.parse(account.refresh_token);
                    if (telegramData.apiId && telegramData.apiHash && telegramData.session) {
                        const tgChannels = await accountApi.getTelegramChannels(account.id);
                        allCommunities.push(...tgChannels.map(channel => {
                            const channelData = channel as any;
                            const channelName = typeof channelData.title === 'string' ? channelData.title : 'Unnamed Channel';
                            return {
                                id: channel.id.toString(),
                                platform: 'telegram' as const,
                                accountId: account.id.toString(),
                                photo: channel.photo || '',
                                name: channelName,
                                type: 'channel'
                            } as Community;
                        }));
                    }
                }
            }

            console.log('Fetched communities:', allCommunities); // Debug log
            setCommunities(allCommunities);
        } catch (error) {
            console.error('Error fetching communities:', error);
            setError('Failed to load communities');
        }
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [postsResponse] = await Promise.all([
                postApi.getPosts(),
                fetchCommunities()
            ]);
            setPosts(postsResponse.posts);
            setFilteredPosts(postsResponse.posts);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        fetchData();
    }, [isAuthenticated, navigate, fetchData]);

    useEffect(() => {
        // Фильтрация постов при изменении параметров поиска
        let filtered = [...posts];

        // Фильтр по тексту
        if (searchQuery) {
            filtered = filtered.filter(post => 
                post.text.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Фильтр по платформе
        if (selectedPlatform !== 'all') {
            filtered = filtered.filter(post => post.platform === selectedPlatform);
        }

        // Фильтр по сообществам (мультиселект)
        if (selectedCommunities.length > 0) {
            filtered = filtered.filter(post => selectedCommunities.includes(post.community.id));
        }

        setFilteredPosts(filtered);
    }, [searchQuery, selectedPlatform, selectedCommunities, posts]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handlePlatformChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedPlatform(event.target.value);
    };

    const handleCommunityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setSelectedCommunities(typeof value === 'string' ? value.split(',') : value);
    };

    const handleDeletePost = async (postId: string, communityId: string, platform: 'vk' | 'telegram') => {
        try {
            await postApi.deletePost({
                platform,
                postId,
                communityId,
                channelId: platform === 'telegram' ? communityId : undefined
            });
            
            // Обновляем список постов
            const response = await postApi.getPosts();
            setPosts(response.posts);
            setFilteredPosts(response.posts);
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>;
    }

    if (error) {
        return <div className="text-red-500 text-center mt-4">{error}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Posts</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Create Post
                </button>
            </div>

            <div className="mb-6 space-y-4">
                <SearchBar onSearch={handleSearch} />
                
                <div className="flex gap-4">
                    <select
                        value={selectedPlatform}
                        onChange={handlePlatformChange}
                        className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                        <option value="all">All Platforms</option>
                        <option value="vk">VK</option>
                        <option value="telegram">Telegram</option>
                    </select>

                    <select
                        value={selectedCommunities}
                        onChange={handleCommunityChange}
                        multiple
                        className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors flex-grow"
                    >
                        {communities.map(community => (
                            <option key={community.id} value={community.id}>
                                {community.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="max-w-2xl mx-auto">
                {filteredPosts.map(post => (
                    <PostCard 
                        key={`${post.platform}-${post.id}`} 
                        post={post}
                        onPostDeleted={() => handleDeletePost(post.id, post.community.id, post.platform)}
                    />
                ))}
            </div>

            <Dialog 
                open={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Create New Post</DialogTitle>
                <DialogContent>
                    <CreatePostForm
                        communities={communities}
                        onClose={() => setIsCreateModalOpen(false)}
                        onPostCreated={() => {
                            setIsCreateModalOpen(false);
                            fetchData();
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Posts; 