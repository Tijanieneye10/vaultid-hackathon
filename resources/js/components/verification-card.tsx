import { Link } from '@inertiajs/react';
import type { CardData } from '@/types';
import StatusBadge from '@/components/status-badge';

interface VerificationCardProps {
    card: CardData;
    onShare: (verificationId: string) => void;
}

const iconMap: Record<string, string> = {
    'shield-check': '\u{1F6E1}',
    fingerprint: '\u{1F91A}',
    globe: '\u{1F310}',
    car: '\u{1F697}',
    vote: '\u{1F5F3}',
};

export default function VerificationCard({ card, onShare }: VerificationCardProps) {
    const isVerified = card.verification?.status === 'verified';
    const isPending = card.verification?.status === 'pending';
    const icon = iconMap[card.icon] ?? '\u{1F4CB}';

    return (
        <div
            className={`glass-card p-6 ${isVerified ? 'card-glow-success border-vault-success/30' : 'card-glow'}`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                        <h3 className="text-sm font-semibold text-vault-text">{card.label}</h3>
                        <p className="text-xs text-vault-muted">{card.full_label}</p>
                    </div>
                </div>
            </div>

            {card.verification ? (
                <div className="space-y-3">
                    <StatusBadge status={card.verification.status as 'verified' | 'pending' | 'failed'} />

                    {isVerified && card.verification.verified_at && (
                        <p className="text-xs text-vault-muted">
                            Verified {card.verification.verified_at}
                        </p>
                    )}

                    {isVerified && card.verification.merkle_root && (
                        <code className="hash-display block text-xs truncate">
                            {card.verification.merkle_root}
                        </code>
                    )}

                    {isVerified && (
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-vault-muted">
                                {card.verification.share_count} active share
                                {card.verification.share_count !== 1 ? 's' : ''}
                            </span>
                            <button
                                onClick={() => onShare(card.verification!.id)}
                                className="text-xs btn-gradient !px-4 !py-1.5"
                            >
                                Share
                            </button>
                        </div>
                    )}

                    {isPending && (
                        <p className="text-xs text-vault-warning">Verification in progress...</p>
                    )}
                </div>
            ) : (
                <div className="pt-2">
                    <Link
                        href={`/verify/${card.id_type}`}
                        className="inline-block text-sm btn-gradient !px-5 !py-2"
                    >
                        Verify {card.label}
                    </Link>
                </div>
            )}
        </div>
    );
}
