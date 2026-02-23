import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/components/layout/app-layout';
import type { ShareLinkData } from '@/types';

interface SharesProps {
    links: ShareLinkData[];
}

export default function Shares({ links }: SharesProps) {
    const [copiedHash, setCopiedHash] = useState<string | null>(null);

    async function copy(url: string, hash: string): Promise<void> {
        await navigator.clipboard.writeText(url);
        setCopiedHash(hash);
        setTimeout(() => setCopiedHash(null), 2000);
    }

    function deactivate(id: string): void {
        if (confirm('Deactivate this link? Anyone using it will lose access.')) {
            router.delete(`/shares/${id}`);
        }
    }

    return (
        <AppLayout>
            <Head title="Shared Links" />

            <h1 className="text-2xl font-bold text-vault-text mb-2">Shared Links</h1>
            <p className="text-vault-muted mb-8">Manage your verification share links</p>

            {links.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <div className="text-4xl mb-4 opacity-50">
                        <svg
                            className="w-12 h-12 mx-auto text-vault-muted"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-vault-text mb-2">
                        No share links yet
                    </h3>
                    <p className="text-vault-muted text-sm mb-6">
                        Verify an ID, then generate a share link from your dashboard.
                    </p>
                    <button onClick={() => router.visit('/dashboard')} className="btn-gradient">
                        Go to Dashboard
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {links.map((link) => (
                        <div
                            key={link.id}
                            className={`glass-card p-5 flex items-center justify-between gap-4 ${!link.is_active ? 'opacity-50' : ''}`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <span
                                        className={
                                            link.is_active
                                                ? 'badge-verified'
                                                : 'badge-unverified'
                                        }
                                    >
                                        {link.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className="text-sm font-medium text-vault-text">
                                        {link.id_type}
                                    </span>
                                    {link.label && (
                                        <span className="text-sm text-vault-muted">
                                            &middot; {link.label}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="hash-display truncate block flex-1">
                                        {link.url}
                                    </code>
                                    <button
                                        onClick={() => copy(link.url, link.share_hash)}
                                        className={`shrink-0 p-2 rounded-lg hover:bg-vault-accent/10 transition-colors ${
                                            copiedHash === link.share_hash
                                                ? 'text-vault-success'
                                                : 'text-vault-muted'
                                        }`}
                                        title={
                                            copiedHash === link.share_hash
                                                ? 'Copied!'
                                                : 'Copy link'
                                        }
                                    >
                                        {copiedHash === link.share_hash ? (
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-vault-muted">
                                    <span>
                                        {link.access_count} access
                                        {link.access_count !== 1 ? 'es' : ''}
                                    </span>
                                    {link.last_accessed_at && (
                                        <span>Last: {link.last_accessed_at}</span>
                                    )}
                                    <span>Created {link.created_at}</span>
                                </div>
                            </div>
                            {link.is_active && (
                                <button
                                    onClick={() => deactivate(link.id)}
                                    className="shrink-0 p-2 rounded-lg text-vault-muted hover:text-vault-error hover:bg-vault-error-bg transition-colors"
                                    title="Deactivate"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
