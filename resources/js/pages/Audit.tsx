import { Head, router } from '@inertiajs/react';
import AppLayout from '@/components/layout/app-layout';
import type { AuditEvent } from '@/types';

interface AuditProps {
    events: AuditEvent[];
}

const eventTypeConfig: Record<
    string,
    { color: string; bgColor: string; borderColor: string; label: string }
> = {
    verification_completed: {
        color: 'text-vault-accent',
        bgColor: 'bg-vault-accent/10',
        borderColor: 'border-vault-accent/30',
        label: 'Verification',
    },
    share_link_created: {
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10',
        borderColor: 'border-blue-400/30',
        label: 'Share Created',
    },
    share_link_accessed: {
        color: 'text-vault-success',
        bgColor: 'bg-vault-success/10',
        borderColor: 'border-vault-success/30',
        label: 'Access',
    },
    share_link_deactivated: {
        color: 'text-vault-error',
        bgColor: 'bg-vault-error/10',
        borderColor: 'border-vault-error/30',
        label: 'Deactivation',
    },
};

function getEventConfig(eventType: string): (typeof eventTypeConfig)[string] {
    return (
        eventTypeConfig[eventType] ?? {
            color: 'text-vault-muted',
            bgColor: 'bg-vault-muted/10',
            borderColor: 'border-vault-muted/30',
            label: eventType.replace(/_/g, ' '),
        }
    );
}

export default function Audit({ events }: AuditProps) {
    return (
        <AppLayout>
            <Head title="Audit Trail" />

            <h1 className="text-2xl font-bold text-vault-text mb-2">Audit Trail</h1>
            <p className="text-vault-muted mb-8">
                Immutable event log stored on 0G Storage Network
            </p>

            {events.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <div className="mb-4">
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-vault-text mb-2">
                        No audit events yet
                    </h3>
                    <p className="text-vault-muted text-sm mb-6">
                        Events will appear here once you verify an ID or create a share link.
                    </p>
                    <button onClick={() => router.visit('/dashboard')} className="btn-gradient">
                        Go to Dashboard
                    </button>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-vault-border" />

                    <div className="space-y-6">
                        {events.map((event) => {
                            const config = getEventConfig(event.event_type);

                            return (
                                <div key={event.id} className="relative flex gap-4">
                                    {/* Timeline dot */}
                                    <div
                                        className={`relative z-10 shrink-0 w-12 h-12 rounded-full ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}
                                    >
                                        {event.event_type === 'verification_completed' && (
                                            <svg
                                                className={`w-5 h-5 ${config.color}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                />
                                            </svg>
                                        )}
                                        {event.event_type === 'share_link_created' && (
                                            <svg
                                                className={`w-5 h-5 ${config.color}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                                />
                                            </svg>
                                        )}
                                        {event.event_type === 'share_link_accessed' && (
                                            <svg
                                                className={`w-5 h-5 ${config.color}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                        )}
                                        {event.event_type === 'share_link_deactivated' && (
                                            <svg
                                                className={`w-5 h-5 ${config.color}`}
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
                                        )}
                                        {!eventTypeConfig[event.event_type] && (
                                            <svg
                                                className={`w-5 h-5 ${config.color}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Event card */}
                                    <div className="glass-card p-5 flex-1 card-glow">
                                        <div className="flex items-center justify-between mb-2">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}
                                            >
                                                {config.label}
                                            </span>
                                            <span className="text-xs text-vault-muted">
                                                {event.timestamp}
                                            </span>
                                        </div>
                                        <p className="text-sm text-vault-text mb-2">
                                            {event.description}
                                        </p>
                                        {event.og_log_hash && (
                                            <div className="mt-2">
                                                <span className="text-xs text-vault-muted">
                                                    0G Log Hash
                                                </span>
                                                <code className="hash-display block mt-1 text-xs truncate">
                                                    {event.og_log_hash}
                                                </code>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
