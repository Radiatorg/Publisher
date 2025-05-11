import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Typography,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Divider,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Collapse
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { postApi } from '../api/postApi';

interface Community {
    id: string;
    name: string;
    photo: string;
    type: string;
    platform: 'vk' | 'telegram';
    accountId: string;
}

export interface CreatePostFormProps {
    communities: Community[];
    onClose: () => void;
    onPostCreated: () => void;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
    communities,
    onClose,
    onPostCreated
}) => {
    const [selectedPlatforms, setSelectedPlatforms] = useState({
        vk: false,
        telegram: false
    });
    const [selectedVkCommunities, setSelectedVkCommunities] = useState<string[]>([]);
    const [selectedTgChannels, setSelectedTgChannels] = useState<string[]>([]);
    const [text, setText] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

    const vkCommunities = communities.filter(c => c.platform === 'vk');
    const tgChannels = communities.filter(c => c.platform === 'telegram');

    const handlePlatformChange = (platform: 'vk' | 'telegram') => (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setSelectedPlatforms(prev => ({
            ...prev,
            [platform]: isChecked
        }));
        
        // Если платформа выбрана, выбираем все сообщества этой платформы
        if (isChecked) {
            if (platform === 'vk') {
                setSelectedVkCommunities(vkCommunities.map(c => c.id));
            } else {
                setSelectedTgChannels(tgChannels.map(c => c.id));
            }
        } else {
            // Если платформа отключена, очищаем выбранные сообщества
            if (platform === 'vk') {
                setSelectedVkCommunities([]);
            } else {
                setSelectedTgChannels([]);
            }
        }
    };

    const handleCommunityChange = (platform: 'vk' | 'telegram') => (communityId: string) => {
        if (platform === 'vk') {
            setSelectedVkCommunities(prev => 
                prev.includes(communityId)
                    ? prev.filter(id => id !== communityId)
                    : [...prev, communityId]
            );
        } else {
            setSelectedTgChannels(prev =>
                prev.includes(communityId)
                    ? prev.filter(id => id !== communityId)
                    : [...prev, communityId]
            );
        }
    };

    const handlePlatformExpand = (platform: string) => {
        setExpandedPlatform(expandedPlatform === platform ? null : platform);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const formData = new FormData();
            formData.append('text', text);
            
            // Добавляем файлы, если они есть
            attachments.forEach(file => {
                formData.append('attachments', file);
            });

            // Добавляем выбранные VK сообщества
            selectedVkCommunities.forEach(communityId => {
                const community = vkCommunities.find(c => c.id === communityId);
                if (community) {
                    formData.append('accountId', community.accountId);
                    formData.append('targetId', communityId);
                    formData.append('platform', 'vk');
                }
            });

            // Добавляем выбранные Telegram каналы
            selectedTgChannels.forEach(channelId => {
                const channel = tgChannels.find(c => c.id === channelId);
                if (channel) {
                    formData.append('accountId', channel.accountId);
                    formData.append('targetId', channelId);
                    formData.append('platform', 'telegram');
                }
            });

            await postApi.createPost(formData);
            onPostCreated();
            onClose();
        } catch (error) {
            console.error('Error creating post:', error);
            // Здесь можно добавить обработку ошибок
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(Array.from(e.target.files));
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Stack spacing={3}>
                <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Выберите платформы и сообщества
                    </Typography>
                    
                    {/* VK Platform */}
                    <List>
                        <ListItem 
                            onClick={() => handlePlatformExpand('vk')}
                            sx={{ cursor: 'pointer' }}
                        >
                            <ListItemIcon>
                                <Checkbox
                                    checked={selectedPlatforms.vk}
                                    onChange={handlePlatformChange('vk')}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </ListItemIcon>
                            <ListItemText primary="ВКонтакте" />
                            {expandedPlatform === 'vk' ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={expandedPlatform === 'vk' && selectedPlatforms.vk} timeout="auto" unmountOnExit>
                            <List disablePadding>
                                {vkCommunities.map((community) => (
                                    <ListItem
                                        key={community.id}
                                        onClick={() => handleCommunityChange('vk')(community.id)}
                                        sx={{ pl: 4, cursor: 'pointer' }}
                                    >
                                        <ListItemIcon>
                                            <Checkbox
                                                checked={selectedVkCommunities.includes(community.id)}
                                                edge="start"
                                            />
                                        </ListItemIcon>
                                        <ListItemText primary={community.name} />
                                    </ListItem>
                                ))}
                            </List>
                        </Collapse>
                    </List>

                    {/* Telegram Platform */}
                    <List>
                        <ListItem 
                            onClick={() => handlePlatformExpand('telegram')}
                            sx={{ cursor: 'pointer' }}
                        >
                            <ListItemIcon>
                                <Checkbox
                                    checked={selectedPlatforms.telegram}
                                    onChange={handlePlatformChange('telegram')}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </ListItemIcon>
                            <ListItemText primary="Telegram" />
                            {expandedPlatform === 'telegram' ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={expandedPlatform === 'telegram' && selectedPlatforms.telegram} timeout="auto" unmountOnExit>
                            <List disablePadding>
                                {tgChannels.map((channel) => (
                                    <ListItem
                                        key={channel.id}
                                        onClick={() => handleCommunityChange('telegram')(channel.id)}
                                        sx={{ pl: 4, cursor: 'pointer' }}
                                    >
                                        <ListItemIcon>
                                            <Checkbox
                                                checked={selectedTgChannels.includes(channel.id)}
                                                edge="start"
                                            />
                                        </ListItemIcon>
                                        <ListItemText primary={channel.name} />
                                    </ListItem>
                                ))}
                            </List>
                        </Collapse>
                    </List>
                </Paper>

                <Divider />

                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Текст поста"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                />

                <Box>
                    <input
                        accept="image/*,video/*"
                        style={{ display: 'none' }}
                        id="raised-button-file"
                        multiple
                        type="file"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="raised-button-file">
                        <Button
                            variant="outlined"
                            component="span"
                            startIcon={<CloudUploadIcon />}
                        >
                            Добавить вложения
                        </Button>
                    </label>
                    {attachments.length > 0 && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Выбрано файлов: {attachments.length}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button onClick={onClose}>
                        Отмена
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={
                            !text ||
                            (!selectedPlatforms.vk && !selectedPlatforms.telegram) ||
                            (selectedPlatforms.vk && selectedVkCommunities.length === 0) ||
                            (selectedPlatforms.telegram && selectedTgChannels.length === 0)
                        }
                    >
                        Опубликовать
                    </Button>
                </Box>
            </Stack>
        </Box>
    );
}; 