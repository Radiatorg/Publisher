import React from 'react';
import { Post } from '../types/post';
import { formatDate } from '../utils/date';
import { Card, CardContent, Typography, Box, Chip, Avatar } from '@mui/material';
import TelegramIcon from '@mui/icons-material/Telegram';
import VKIcon from '@mui/icons-material/Public';

interface PostCardProps {
    post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const platformIcon = post.platform === 'vk' ? (
        <VKIcon sx={{ mr: 1 }} />
    ) : (
        <TelegramIcon sx={{ mr: 1 }} />
    );
    const platformColor = post.platform === 'vk' ? '#4C75A3' : '#0088cc';

    // Обработка медиафайлов
    const mediaItems = post.media?.map((mediaUrl, index) => {
        const type = post.type === 'photo' ? 'photo' : 'video';
        return {
            type,
            url: mediaUrl
        };
    }) || [];

    const attachments = post.attachments || mediaItems;

    return (
        <Card sx={{ mb: 2, position: 'relative' }}>
            {post.isPinned && (
                <Chip
                    label="Закреплено"
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                />
            )}
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        {platformIcon}
                        <Avatar
                            src={post.community.photo}
                            alt={post.community.name}
                            sx={{ mr: 1 }}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1">
                            {post.community.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip
                                icon={platformIcon}
                                label={post.platform.toUpperCase()}
                                size="small"
                                sx={{ 
                                    backgroundColor: platformColor,
                                    color: 'white',
                                    mr: 1
                                }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                {formatDate(post.date)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {post.text && (
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        {post.text}
                    </Typography>
                )}

                {attachments.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        {attachments.map((attachment, index) => (
                            <Box key={index} sx={{ mb: 1 }}>
                                {attachment.type === 'photo' && (
                                    <img 
                                        src={attachment.url} 
                                        alt={`Attachment ${index + 1}`}
                                        style={{ maxWidth: '100%', maxHeight: '300px' }}
                                    />
                                )}
                                {attachment.type === 'video' && (
                                    <video 
                                        controls 
                                        style={{ maxWidth: '100%', maxHeight: '300px' }}
                                    >
                                        <source src={attachment.url} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    {post.views > 0 && (
                        <Typography variant="caption">
                            👁 {post.views}
                        </Typography>
                    )}
                    {post.likes > 0 && (
                        <Typography variant="caption">
                            ❤️ {post.likes}
                        </Typography>
                    )}
                    {post.reposts > 0 && (
                        <Typography variant="caption">
                            🔄 {post.reposts}
                        </Typography>
                    )}
                    {post.comments > 0 && (
                        <Typography variant="caption">
                            💬 {post.comments}
                        </Typography>
                    )}
                    {post.forwards > 0 && (
                        <Typography variant="caption">
                            📤 {post.forwards}
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}; 