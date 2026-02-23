interface StatusBadgeProps {
    status: 'verified' | 'pending' | 'failed';
    label?: string;
}

const statusConfig: Record<string, { className: string; defaultLabel: string }> = {
    verified: { className: 'badge-verified', defaultLabel: 'Verified' },
    pending: { className: 'badge-pending', defaultLabel: 'Pending' },
    failed: { className: 'badge-unverified', defaultLabel: 'Failed' },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
    const config = statusConfig[status] ?? statusConfig.failed;

    return (
        <span className={config.className}>
            {status === 'verified' && (
                <span className="w-1.5 h-1.5 rounded-full bg-vault-success inline-block" />
            )}
            {status === 'pending' && (
                <span className="w-1.5 h-1.5 rounded-full bg-vault-warning animate-pulse inline-block" />
            )}
            {status === 'failed' && (
                <span className="w-1.5 h-1.5 rounded-full bg-vault-error inline-block" />
            )}
            {label ?? config.defaultLabel}
        </span>
    );
}
