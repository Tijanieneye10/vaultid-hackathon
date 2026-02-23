import { Head, useForm, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';

interface InputFieldProps {
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    placeholder?: string;
}

function InputField({ label, type = 'text', value, onChange, error, placeholder }: InputFieldProps) {
    return (
        <div>
            <label className="block text-sm text-vault-muted mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input-dark"
                placeholder={placeholder}
            />
            {error && <p className="text-xs text-vault-error mt-1">{error}</p>}
        </div>
    );
}

export default function Login() {
    const [activeTab, setActiveTab] = useState<'wallet' | 'email'>('wallet');
    const [isRegistering, setIsRegistering] = useState(false);
    const [walletConnecting, setWalletConnecting] = useState(false);
    const [walletError, setWalletError] = useState('');

    const emailForm = useForm({
        email: '',
        password: '',
        password_confirmation: '',
    });

    async function connectWallet(): Promise<void> {
        setWalletConnecting(true);
        setWalletError('');
        try {
            if (!window.ethereum) {
                setWalletError('No wallet detected. Please install MetaMask or OKX Wallet.');
                return;
            }

            const accounts = (await window.ethereum.request({
                method: 'eth_requestAccounts',
            })) as string[];
            const address = accounts[0];
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const nonceResponse = await fetch('/auth/wallet/nonce', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf ?? '',
                },
                body: JSON.stringify({ address }),
            });

            if (!nonceResponse.ok) {
                const error = (await nonceResponse.json()) as { message?: string };
                throw new Error(error.message ?? 'Failed to get nonce');
            }

            const { message } = (await nonceResponse.json()) as { message: string };

            const signature = (await window.ethereum.request({
                method: 'personal_sign',
                params: [message, address],
            })) as string;

            const verifyResponse = await fetch('/auth/wallet/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf ?? '',
                },
                body: JSON.stringify({ address, signature }),
            });

            if (!verifyResponse.ok) {
                const error = (await verifyResponse.json()) as { message?: string };
                throw new Error(error.message ?? 'Verification failed');
            }

            const result = (await verifyResponse.json()) as {
                success: boolean;
                redirect?: string;
                message?: string;
            };

            if (result.success) {
                router.visit(result.redirect ?? '/dashboard');
            } else {
                setWalletError(result.message ?? 'Authentication failed');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Wallet connection failed';
            setWalletError(errorMessage);
        } finally {
            setWalletConnecting(false);
        }
    }

    function submitEmail(e: FormEvent): void {
        e.preventDefault();
        if (isRegistering) {
            emailForm.post('/register');
        } else {
            emailForm.post('/login');
        }
    }

    return (
        <>
            <Head title="Sign In" />
            <div className="min-h-screen bg-vault-bg flex items-center justify-center p-4">
                {/* Grid background */}
                <div className="fixed inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

                <div className="relative w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold gradient-text mb-2">VaultID</h1>
                        <p className="text-vault-muted">Verify once. Share a hash. Done.</p>
                    </div>

                    {/* Auth Card */}
                    <div className="glass-card p-8">
                        {/* Tab Switcher */}
                        <div className="flex mb-8 bg-vault-bg rounded-xl p-1">
                            <button
                                onClick={() => setActiveTab('wallet')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === 'wallet'
                                        ? 'bg-vault-accent text-white'
                                        : 'text-vault-muted'
                                }`}
                            >
                                Connect Wallet
                            </button>
                            <button
                                onClick={() => setActiveTab('email')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === 'email'
                                        ? 'bg-vault-accent text-white'
                                        : 'text-vault-muted'
                                }`}
                            >
                                Email
                            </button>
                        </div>

                        {activeTab === 'wallet' ? (
                            <div className="space-y-6">
                                <button
                                    onClick={connectWallet}
                                    disabled={walletConnecting}
                                    className="w-full btn-gradient py-3"
                                >
                                    {walletConnecting ? 'Connecting...' : 'Connect MetaMask / OKX'}
                                </button>
                                {walletError && (
                                    <p className="text-sm text-vault-error text-center">
                                        {walletError}
                                    </p>
                                )}
                                <p className="text-xs text-vault-muted text-center">
                                    Supports MetaMask, OKX and EVM wallets
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={submitEmail} className="space-y-4">
                                <InputField
                                    label="Email"
                                    type="email"
                                    value={emailForm.data.email}
                                    onChange={(v) => emailForm.setData('email', v)}
                                    error={emailForm.errors.email}
                                />
                                <InputField
                                    label="Password"
                                    type="password"
                                    value={emailForm.data.password}
                                    onChange={(v) => emailForm.setData('password', v)}
                                    error={emailForm.errors.password}
                                />
                                {isRegistering && (
                                    <InputField
                                        label="Confirm Password"
                                        type="password"
                                        value={emailForm.data.password_confirmation}
                                        onChange={(v) =>
                                            emailForm.setData('password_confirmation', v)
                                        }
                                        error={emailForm.errors.password_confirmation}
                                    />
                                )}
                                <button
                                    type="submit"
                                    disabled={emailForm.processing}
                                    className="w-full btn-gradient py-3"
                                >
                                    {emailForm.processing
                                        ? 'Please wait...'
                                        : isRegistering
                                          ? 'Create Account'
                                          : 'Sign In'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsRegistering(!isRegistering)}
                                    className="w-full text-sm text-vault-muted hover:text-vault-accent transition-colors"
                                >
                                    {isRegistering
                                        ? 'Already have an account? Sign in'
                                        : "Don't have an account? Register"}
                                </button>
                            </form>
                        )}
                    </div>

                    <p className="text-center text-xs text-vault-muted mt-6">
                        Secured by 0G Decentralized Storage
                    </p>
                </div>
            </div>
        </>
    );
}
