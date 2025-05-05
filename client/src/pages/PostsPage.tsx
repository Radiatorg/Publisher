import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types/post';
import { PostCard } from '../components/PostCard';
import { CreatePostForm } from '../components/CreatePostForm';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import api from '../services/api';

export const PostsPage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const fetchPosts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/accounts/posts');
            if (response.data && Array.isArray(response.data.posts)) {
                setPosts(response.data.posts);
            } else {
                setError('Invalid response format from server');
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
            setError('Failed to load posts. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchPosts();
    }, [isAuthenticated, navigate]);

    const handlePostCreated = () => {
        fetchPosts(); // Refresh posts after creating a new one
    };

    if (loading && posts.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <CreatePostForm onPostCreated={handlePostCreated} />

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Typography variant="h4" component="h1" gutterBottom>
                Posts ({posts.length})
            </Typography>

            {posts.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                    No posts found
                </Typography>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
                    {posts.map((post) => (
                        <PostCard key={`${post.platform}-${post.id}`} post={post} />
                    ))}
                </Box>
            )}
        </Container>
    );
}; 