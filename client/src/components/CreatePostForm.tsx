import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    IconButton,
    Paper,
    Checkbox,
    ListItemText,
    OutlinedInput,
    SelectChangeEvent
} from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import { Account } from '../types/account';
import api from '../services/api';

interface CreatePostFormProps {
    onPostCreated: () => void;
}

interface Community {
    id: string | number;
    name: string;
    photo?: string;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 300,
        },
    },
};

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [communities, setCommunities] = useState<{ [key: string]: Community[] }>({});
    const [selectedCommunities, setSelectedCommunities] = useState<{ [key: string]: string }>({});
    const [text, setText] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data);
            
            // Получаем сообщества для каждого аккаунта
            const communitiesData: { [key: string]: Community[] } = {};
            for (const account of response.data) {
                if (account.platform_id === 1) { // VK
                    const vkResponse = await api.get(`/accounts/${account.id}/communities`);
                    communitiesData[account.id] = vkResponse.data;
                } else if (account.platform_id === 2) { // Telegram
                    const tgResponse = await api.get(`/accounts/${account.id}/channels`);
                    communitiesData[account.id] = tgResponse.data;
                }
            }
            setCommunities(communitiesData);
        } catch (err) {
            console.error('Error fetching accounts:', err);
            setError('Failed to load accounts');
        }
    };

    const handleAccountChange = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value;
        
        // Handle "Select All" option
        if (value[value.length - 1] === 'all') {
            if (selectedAccounts.length === accounts.length) {
                setSelectedAccounts([]);
                setSelectedCommunities({});
            } else {
                setSelectedAccounts(accounts.map(account => account.id.toString()));
                // Автоматически выбираем первое сообщество для каждого аккаунта
                const newSelectedCommunities: { [key: string]: string } = {};
                accounts.forEach(account => {
                    if (communities[account.id] && communities[account.id].length > 0) {
                        newSelectedCommunities[account.id] = communities[account.id][0].id.toString();
                    }
                });
                setSelectedCommunities(newSelectedCommunities);
            }
            return;
        }

        setSelectedAccounts(value as string[]);
    };

    const handleCommunityChange = (accountId: string, communityId: string) => {
        setSelectedCommunities(prev => ({
            ...prev,
            [accountId]: communityId
        }));
    };

    const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setText(event.target.value);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            setAttachments(prev => [...prev, ...newFiles]);
            
            // Create preview URLs
            const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(previewUrls[index]);
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (selectedAccounts.length === 0 || !text) {
            setError('Please select at least one account and enter post text');
            return;
        }

        // Проверяем, что для каждого выбранного аккаунта выбрано сообщество
        const missingCommunities = selectedAccounts.filter(accountId => {
            const account = accounts.find(acc => acc.id.toString() === accountId);
            return account && (!selectedCommunities[accountId] || !communities[accountId] || communities[accountId].length === 0);
        });

        if (missingCommunities.length > 0) {
            const accountNames = missingCommunities.map(id => {
                const account = accounts.find(acc => acc.id.toString() === id);
                return account ? `${account.platform_id === 1 ? 'VK' : 'Telegram'} - ${account.account_sn_id}` : '';
            }).join(', ');
            setError(`Please select a community/channel for: ${accountNames}`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Create posts for all selected accounts
            const promises = selectedAccounts.map(async (accountId) => {
                const formData = new FormData();
                formData.append('accountId', accountId);
                formData.append('text', text);
                formData.append('targetId', selectedCommunities[accountId]);
                
                attachments.forEach((file) => {
                    formData.append(`attachments`, file);
                });

                return api.post('accounts/posts', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            });

            await Promise.all(promises);

            // Reset form
            setText('');
            setAttachments([]);
            setPreviewUrls([]);
            setSelectedAccounts([]);
            setSelectedCommunities({});
            
            // Notify parent component
            onPostCreated();
        } catch (err) {
            console.error('Error creating posts:', err);
            setError('Failed to create posts');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
                Create New Post
            </Typography>
            
            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Top row: Account selection */}
                    <Box sx={{ width: '300px' }}>
                        <FormControl fullWidth>
                            <InputLabel>Select Accounts</InputLabel>
                            <Select
                                multiple
                                value={selectedAccounts}
                                onChange={handleAccountChange}
                                input={<OutlinedInput label="Select Accounts" />}
                                renderValue={(selected) => {
                                    if (selected.length === accounts.length) {
                                        return 'All Accounts';
                                    }
                                    return selected
                                        .map(id => {
                                            const account = accounts.find(acc => acc.id.toString() === id);
                                            return account ? `${account.platform_id === 1 ? 'VK' : 'Telegram'} - ${account.account_sn_id}` : '';
                                        })
                                        .join(', ');
                                }}
                                MenuProps={MenuProps}
                            >
                                <MenuItem value="all">
                                    <Checkbox
                                        checked={selectedAccounts.length === accounts.length}
                                        indeterminate={selectedAccounts.length > 0 && selectedAccounts.length < accounts.length}
                                    />
                                    <ListItemText primary="Select All" />
                                </MenuItem>
                                {accounts.map((account) => (
                                    <MenuItem key={account.id} value={account.id.toString()}>
                                        <Checkbox checked={selectedAccounts.includes(account.id.toString())} />
                                        <ListItemText 
                                            primary={`${account.platform_id === 1 ? 'VK' : 'Telegram'} - ${account.account_sn_id}`}
                                        />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Community selection for each account */}
                    {selectedAccounts.map(accountId => {
                        const account = accounts.find(acc => acc.id.toString() === accountId);
                        if (!account || !communities[accountId] || communities[accountId].length === 0) return null;

                        return (
                            <Box key={accountId} sx={{ width: '300px' }}>
                                <FormControl fullWidth>
                                    <InputLabel>{account.platform_id === 1 ? 'Select VK Community' : 'Select Telegram Channel'}</InputLabel>
                                    <Select
                                        value={selectedCommunities[accountId] || ''}
                                        onChange={(e) => handleCommunityChange(accountId, e.target.value)}
                                        input={<OutlinedInput label={account.platform_id === 1 ? 'Select VK Community' : 'Select Telegram Channel'} />}
                                    >
                                        {communities[accountId].map(community => (
                                            <MenuItem key={community.id} value={community.id.toString()}>
                                                {community.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        );
                    })}

                    {/* Middle row: Text input */}
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={text}
                        onChange={handleTextChange}
                        label="Post Text"
                        placeholder="Write your post here..."
                    />

                    {/* Bottom row: Media upload and Submit button */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box>
                            <input
                                accept="image/*,video/*"
                                style={{ display: 'none' }}
                                id="attachment-input"
                                type="file"
                                multiple
                                onChange={handleFileChange}
                            />
                            <label htmlFor="attachment-input">
                                <Button
                                    component="span"
                                    variant="outlined"
                                    startIcon={<PhotoCamera />}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Add photos or videos
                                </Button>
                            </label>
                        </Box>

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            sx={{ minWidth: '120px' }}
                        >
                            {loading ? 'Creating...' : 'Create Post'}
                        </Button>
                    </Box>

                    {/* Media previews */}
                    {previewUrls.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                            {previewUrls.map((url, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        position: 'relative',
                                        width: 100,
                                        height: 100,
                                    }}
                                >
                                    <img
                                        src={url}
                                        alt={`Preview ${index + 1}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    <IconButton
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: -8,
                                            right: -8,
                                            bgcolor: 'background.paper',
                                        }}
                                        onClick={() => removeAttachment(index)}
                                    >
                                        <Delete />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    )}

                    {error && (
                        <Typography color="error" sx={{ mt: 1 }}>
                            {error}
                        </Typography>
                    )}
                </Box>
            </form>
        </Paper>
    );
}; 