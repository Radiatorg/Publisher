import React, { useState } from 'react';
import { Button, TextField, Box, Typography, CircularProgress } from '@mui/material';
import { accountApi } from '../api/accountApi';

interface TelegramSessionGeneratorProps {
    onSessionGenerated: (session: string) => void;
    apiId: string;
    apiHash: string;
}

export const TelegramSessionGenerator: React.FC<TelegramSessionGeneratorProps> = ({ 
    onSessionGenerated,
    apiId,
    apiHash
}) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState<'initial' | 'code' | 'password'>('initial');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStartAuth = async () => {
        if (!apiId || !apiHash) {
            setError('API ID and API Hash are required');
            return;
        }

        if (!phoneNumber) {
            setError('Phone number is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Sending auth request with:', { apiId, apiHash, phoneNumber });
            await accountApi.startTelegramAuth({
                apiId: parseInt(apiId),
                apiHash,
                phoneNumber
            });
            setStep('code');
        } catch (err) {
            console.error('Auth error:', err);
            setError(err instanceof Error ? err.message : 'Failed to start authentication');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await accountApi.verifyTelegramCode({
                apiId: parseInt(apiId),
                apiHash,
                phoneNumber,
                code: verificationCode
            });
            
            if (response.requiresPassword) {
                setStep('password');
            } else {
                onSessionGenerated(response.session);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify code');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitPassword = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await accountApi.submitTelegramPassword({
                apiId: parseInt(apiId),
                apiHash,
                phoneNumber,
                password
            });
            onSessionGenerated(response.session);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit password');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        if (step === 'initial') {
            handleStartAuth();
        } else if (step === 'code') {
            handleVerifyCode();
        } else {
            handleSubmitPassword();
        }
    };

    return (
        <Box>
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}

            {step === 'initial' && (
                <>
                    <TextField
                        fullWidth
                        label="Phone Number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        margin="normal"
                        required
                        placeholder="+1234567890"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: 'rgb(229, 231, 235)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgb(59, 130, 246)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'rgb(59, 130, 246)',
                                },
                                backgroundColor: 'white',
                            },
                            '& .MuiInputLabel-root': {
                                color: 'rgb(107, 114, 128)',
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                                color: 'rgb(59, 130, 246)',
                            },
                        }}
                    />
                </>
            )}

            {step === 'code' && (
                <TextField
                    fullWidth
                    label="Verification Code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    margin="normal"
                    required
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: 'rgb(229, 231, 235)',
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgb(59, 130, 246)',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: 'rgb(59, 130, 246)',
                            },
                            backgroundColor: 'white',
                        },
                        '& .MuiInputLabel-root': {
                            color: 'rgb(107, 114, 128)',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: 'rgb(59, 130, 246)',
                        },
                    }}
                />
            )}

            {step === 'password' && (
                <TextField
                    fullWidth
                    label="2FA Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    required
                    type="password"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: 'rgb(229, 231, 235)',
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgb(59, 130, 246)',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: 'rgb(59, 130, 246)',
                            },
                            backgroundColor: 'white',
                        },
                        '& .MuiInputLabel-root': {
                            color: 'rgb(107, 114, 128)',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: 'rgb(59, 130, 246)',
                        },
                    }}
                />
            )}

            <Button
                onClick={handleSubmit}
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                sx={{ mt: 2 }}
            >
                {loading ? <CircularProgress size={24} /> : 
                    step === 'initial' ? 'Start Authentication' :
                    step === 'code' ? 'Verify Code' :
                    'Submit Password'}
            </Button>
        </Box>
    );
}; 