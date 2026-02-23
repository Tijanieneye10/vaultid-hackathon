import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { Auth, Flash } from '@/types';

interface AppLayoutProps {
    children: ReactNode;
}

interface SidebarLinkProps {
    href: string;
    icon: string;
    label: string;
}

const iconSvgs: Record<string, ReactNode> = {
    grid: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
        </svg>
    ),
    share: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
        </svg>
    ),
    clock: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    ),
};

function SidebarLink({ href, icon, label }: SidebarLinkProps) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isActive = currentPath === href || currentPath.startsWith(href + '/');

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                    ? 'bg-vault-accent/10 text-vault-accent'
                    : 'text-vault-muted hover:text-vault-text hover:bg-vault-bg/50'
            }`}
        >
            {iconSvgs[icon] ?? <span className="w-5 h-5" />}
            {label}
        </Link>
    );
}

export default function AppLayout({ children }: AppLayoutProps) {
    const { auth, flash } = usePage().props as unknown as { auth: Auth; flash: Flash };

    return (
        <div className="min-h-screen bg-vault-bg flex">
            {/* Sidebar */}
            <aside className="fixed w-64 h-full bg-vault-surface border-r border-vault-border z-30">
                <div className="p-6">
                    <Link href="/dashboard">
                        <h1 className="text-2xl font-bold gradient-text">VaultID</h1>
                        <p className="text-xs text-vault-muted mt-1">Decentralized KYC Vault</p>
                    </Link>
                </div>
                <nav className="mt-4 space-y-1 px-3">
                    <SidebarLink href="/dashboard" icon="grid" label="Dashboard" />
                    <SidebarLink href="/shares" icon="share" label="Shared Links" />
                    <SidebarLink href="/audit" icon="clock" label="Audit Trail" />
                </nav>
                <div className="absolute bottom-6 left-3 right-3">
                    <div className="glass-card p-3 text-center">
                        <p className="text-xs text-vault-muted">Powered by</p>
                        <p className="text-sm font-bold text-vault-accent">0G Storage Network</p>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="ml-64 flex-1 min-h-screen">
                <header className="sticky top-0 z-20 bg-vault-bg/80 backdrop-blur-xl border-b border-vault-border">
                    <div className="flex items-center justify-between px-8 py-4">
                        <div />
                        <div className="flex items-center gap-4">
                            <span className="hash-display">{auth?.user?.display_name}</span>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="text-sm text-vault-muted hover:text-vault-error transition-colors"
                            >
                                Disconnect
                            </Link>
                        </div>
                    </div>
                </header>
                <div className="p-8">
                    {flash?.success && (
                        <div className="mb-6 p-4 rounded-xl bg-vault-success-bg border border-vault-success/20 text-vault-success text-sm">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-6 p-4 rounded-xl bg-vault-error-bg border border-vault-error/20 text-vault-error text-sm">
                            {flash.error}
                        </div>
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
}
