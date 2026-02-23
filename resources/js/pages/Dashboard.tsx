import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/components/layout/app-layout';
import VerificationCard from '@/components/verification-card';
import type { CardData, DashboardStats, DashboardUser } from '@/types';

interface DashboardProps {
    cards: CardData[];
    stats: DashboardStats;
    user: DashboardUser;
}

interface StatCardProps {
    label: string;
    value: number;
}

function StatCard({ label, value }: StatCardProps) {
    return (
        <div className="glass-card p-6 card-glow">
            <p className="text-vault-muted text-sm mb-1">{label}</p>
            <p className="text-3xl font-bold gradient-text">{value}</p>
        </div>
    );
}

export default function Dashboard({ cards, stats }: DashboardProps) {
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedVerificationId, setSelectedVerificationId] = useState<string | null>(null);
    const [shareLabel, setShareLabel] = useState('');

    function openShareModal(verificationId: string): void {
        setSelectedVerificationId(verificationId);
        setShareLabel('');
        setShowShareModal(true);
    }

    function generateShare(): void {
        router.post(
            '/shares',
            {
                verification_id: selectedVerificationId,
                label: shareLabel || null,
            },
            { onSuccess: () => setShowShareModal(false) },
        );
    }

    return (
        <AppLayout>
            <Head title="Dashboard" />

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Verified IDs" value={stats.total_verified} />
                <StatCard label="Active Shares" value={stats.active_shares} />
                <StatCard label="Total Accesses" value={stats.total_accesses} />
            </div>

            <h2 className="text-xl font-bold text-vault-text mb-6">Identity Verifications</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <VerificationCard key={card.id_type} card={card} onShare={openShareModal} />
                ))}
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowShareModal(false)}
                    />
                    <div className="relative glass-card p-8 w-full max-w-md mx-4">
                        <h3 className="text-lg font-bold text-vault-text mb-4">
                            Generate Share Link
                        </h3>
                        <p className="text-sm text-vault-muted mb-6">
                            Create a link anyone can use to verify your identity.
                        </p>
                        <input
                            value={shareLabel}
                            onChange={(e) => setShareLabel(e.target.value)}
                            className="input-dark mb-6"
                            placeholder="Label (optional, e.g. 'For Kuda Bank')"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="flex-1 btn-outline"
                            >
                                Cancel
                            </button>
                            <button onClick={generateShare} className="flex-1 btn-gradient">
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
