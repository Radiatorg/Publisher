import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Post } from '../types/post';
import { Card, CardContent, Typography, Box, Chip, Avatar, Button, IconButton, Divider } from '@mui/material';
import TelegramIcon from '@mui/icons-material/Telegram';
import VKIcon from '@mui/icons-material/Public';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { postApi } from '../api/postApi';

interface PostCardProps {
    post: Post;
    onPostDeleted?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
    const platformIcon = post.platform === 'vk' ? (
        <VKIcon sx={{ mr: 1 }} />
    ) : (
        <TelegramIcon sx={{ mr: 1 }} />
    );
    const platformColor = post.platform === 'vk' ? '#4C75A3' : '#0088cc';

    const formatDate = (timestamp: number) => {
        return format(new Date(timestamp * 1000), 'd MMMM yyyy, HH:mm', { locale: ru });
    };

    // Функция для преобразования Buffer в base64
    const bufferToBase64 = (buffer: { type: string; data: number[] } | undefined): string => {
        if (!buffer || !buffer.data) return '';
        const binary = buffer.data.map(byte => String.fromCharCode(byte)).join('');
        return `data:image/png;base64,${window.btoa(binary)}`;
    };

    // Функция для получения URL изображения
    const getImageUrl = (attachment: any): string => {
        if (!attachment) return '';
        
        if (post.platform === 'vk') {
            return typeof attachment.url === 'string' ? attachment.url : '';
        } 
        
        if (post.platform === 'telegram') {
            if (typeof attachment.url === 'string') {
                return attachment.url;
            } 
            if (attachment.url?.type === 'Buffer') {
                return bufferToBase64(attachment.url);
            }
        }
        
        return '';
    };

    // Получаем массив вложений или пустой массив, если attachments undefined
    const attachments = post.attachments || [];

    const handleDelete = async () => {
        if (!window.confirm('Вы уверены, что хотите удалить этот пост?')) return;
        try {
            console.log('Deleting post:', post);
            if (!post.id) {
                throw new Error('Post ID is missing');
            }
            if (post.platform === 'vk') {
                await postApi.deletePost({
                    platform: 'vk',
                    accountId: post.community.accountId,
                    communityId: post.community.id,
                    postId: post.id
                });
            } else if (post.platform === 'telegram') {
                console.log('Deleting Telegram post:', {
                    platform: 'telegram',
                    channelId: post.community.id,
                    postId: post.id
                });
                await postApi.deletePost({
                    platform: 'telegram',
                    channelId: post.community.id,
                    postId: post.id
                });
            }
            if (onPostDeleted) onPostDeleted();
        } catch (error: any) {
            console.error('Error deleting post:', error);
            alert('Ошибка при удалении поста: ' + (error?.response?.data?.message || error.message));
        }
    };

    return (
        <Card 
            sx={{ 
                mb: 2, 
                position: 'relative',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                '&:hover': {
                    boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)'
                },
                backgroundColor: '#fff',
                maxWidth: '100%',
                width: '100%'
            }}
        >
            {post.isPinned && (
                <Chip
                    label="Закреплено"
                    size="small"
                    sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        zIndex: 1
                    }}
                />
            )}
            <CardContent sx={{ p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                        src={post.community.photo}
                        alt={post.community.name}
                        sx={{ 
                            width: 48, 
                            height: 48,
                            mr: 2,
                            border: '2px solid #fff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                        }}
                    />
                    <Box sx={{ flex: 1 }}>
                        <Typography 
                            variant="subtitle1" 
                            sx={{ 
                                fontWeight: 600,
                                color: '#2A5885',
                                fontSize: '1rem',
                                mb: 0.5
                            }}
                        >
                            {post.community.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    color: '#656565',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {formatDate(post.date)}
                            </Typography>
                            <Chip
                                icon={platformIcon}
                                label={post.platform.toUpperCase()}
                                size="small"
                                sx={{ 
                                    backgroundColor: platformColor,
                                    color: 'white',
                                    height: '20px',
                                    fontSize: '0.7rem'
                                }}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Content */}
                {post.text && (
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            mb: 2,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: '0.95rem',
                            lineHeight: 1.5,
                            color: '#000'
                        }}
                    >
                        {post.text}
                    </Typography>
                )}

                {/* Attachments */}
                {attachments.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        {attachments.map((attachment, index) => {
                            const imageUrl = getImageUrl(attachment);
                            if (!imageUrl) return null;

                            return (
                                <Box 
                                    key={index} 
                                    sx={{ 
                                        mb: 1,
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        backgroundColor: '#f5f5f5'
                                    }}
                                >
                                    {attachment.type === 'photo' && (
                                        <img 
                                            src={imageUrl} 
                                            alt={`Attachment ${index + 1}`}
                                            style={{ 
                                                width: '100%',
                                                maxHeight: '500px',
                                                objectFit: 'contain',
                                                backgroundColor: '#f5f5f5'
                                            }}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    )}
                                    {(attachment.type === 'video' || attachment.type === 'gif') && (
                                        <video 
                                            src={imageUrl}
                                            controls
                                            style={{ 
                                                width: '100%',
                                                maxHeight: '500px',
                                                backgroundColor: '#000'
                                            }}
                                            onError={(e) => {
                                                (e.target as HTMLVideoElement).style.display = 'none';
                                            }}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                )}

                <Divider sx={{ my: 1.5 }} />

                {/* Stats */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#656565',
                    fontSize: '0.9rem'
                }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            cursor: 'pointer',
                            '&:hover': { color: '#2A5885' }
                        }}>
                            <ThumbUpOutlinedIcon sx={{ fontSize: '1.2rem' }} />
                            <Typography variant="caption">{post.likes || 0}</Typography>
                        </Box>
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            cursor: 'pointer',
                            '&:hover': { color: '#2A5885' }
                        }}>
                            <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: '1.2rem' }} />
                            <Typography variant="caption">{post.comments || 0}</Typography>
                        </Box>
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            cursor: 'pointer',
                            '&:hover': { color: '#2A5885' }
                        }}>
                            <ShareOutlinedIcon sx={{ fontSize: '1.2rem' }} />
                            <Typography variant="caption">{post.reposts || 0}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        color: '#656565'
                    }}>
                        <VisibilityOutlinedIcon sx={{ fontSize: '1.2rem' }} />
                        <Typography variant="caption">{post.views || 0}</Typography>
                    </Box>
                </Box>

                {/* Delete Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <IconButton
                        size="small"
                        color="error"
                        onClick={handleDelete}
                        sx={{ 
                            '&:hover': {
                                backgroundColor: 'rgba(211, 47, 47, 0.04)'
                            }
                        }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
};