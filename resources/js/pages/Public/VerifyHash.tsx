import { Head } from '@inertiajs/react';
import type { PublicVerificationData } from '@/types';
import type { ReactNode } from 'react';

interface VerifyHashProps {
    verification: PublicVerificationData | null;
    error: string | null;
}

interface PublicLayoutProps {
    children: ReactNode;
}

interface FieldProps {
    label: string;
    value: string;
}

function PublicLayout({ children }: PublicLayoutProps) {
    return (
        <div className="min-h-screen bg-vault-bg flex items-center justify-center p-4">
            {/* Grid background */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

            <div className="relative w-full max-w-lg">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold gradient-text">VaultID</h1>
                    <p className="text-xs text-vault-muted mt-1">Verified Identity Data</p>
                </div>
                {children}
            </div>
        </div>
    );
}

function Field({ label, value }: FieldProps) {
    return (
        <div>
            <p className="text-xs text-vault-muted">{label}</p>
            <p className="text-sm text-vault-text font-medium">{value}</p>
        </div>
    );
}

export default function VerifyHash({ verification, error }: VerifyHashProps) {
    if (error || !verification) {
        return (
            <>
                <Head title="Invalid Link" />
                <PublicLayout>
                    <div className="glass-card p-12 text-center">
                        <div className="mb-4">
                            <svg
                                className="w-16 h-16 mx-auto text-vault-error/50"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-vault-text mb-2">
                            Link Invalid
                        </h3>
                        <p className="text-vault-muted text-sm">
                            {error || 'This link is invalid or has been deactivated.'}
                        </p>
                    </div>
                </PublicLayout>
            </>
        );
    }

    const { data, id_type_label, verified_at, integrity } = verification;
    const applicant = (data?.applicant ?? data) as Record<string, string | undefined>;

    return (
        <>
            <Head title={`${id_type_label} Verification`} />
            <PublicLayout>
                {/* Status banner */}
                <div className="glass-card p-5 text-center border-vault-success/30 mb-4">
                    <div className="flex items-center justify-center gap-2">
                        <svg
                            className="w-6 h-6 text-vault-success"
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
                        <span className="text-lg font-bold text-vault-success">
                            Identity Verified
                        </span>
                    </div>
                    <p className="text-xs text-vault-muted mt-1">
                        via VaultID on 0G Storage Network
                    </p>
                </div>

                {/* Data card */}
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="badge-verified">{id_type_label} Verified</span>
                        <span className="text-xs text-vault-muted">
                            {new Date(verified_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                    </div>

                    {applicant?.photo && (
                        <img
                            src={applicant.photo}
                            alt="Photo"
                            className="w-24 h-24 rounded-xl object-cover border border-vault-border"
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {applicant?.firstname && (
                            <Field label="First Name" value={applicant.firstname} />
                        )}
                        {applicant?.lastname && (
                            <Field label="Last Name" value={applicant.lastname} />
                        )}
                        {applicant?.middlename && (
                            <Field label="Middle Name" value={applicant.middlename} />
                        )}
                        {applicant?.birthdate && (
                            <Field label="Date of Birth" value={applicant.birthdate} />
                        )}
                        {applicant?.gender && (
                            <Field label="Gender" value={applicant.gender} />
                        )}
                        {applicant?.phone && (
                            <Field label="Phone" value={applicant.phone} />
                        )}
                    </div>
                    {applicant?.address && (
                        <Field label="Address" value={applicant.address} />
                    )}
                </div>

                {/* Integrity proof */}
                <div className="glass-card p-6 mt-4">
                    <h3 className="text-sm font-semibold text-vault-text mb-3">Integrity Proof</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-vault-muted">Storage</span>
                            <span className="text-vault-accent">{integrity.stored_on}</span>
                        </div>
                        <div>
                            <span className="text-xs text-vault-muted">Merkle Root</span>
                            <code className="hash-display block mt-1 text-xs truncate">
                                {integrity.merkle_root}
                            </code>
                        </div>
                        {integrity.og_log_hash && (
                            <div>
                                <span className="text-xs text-vault-muted">Audit Log Hash</span>
                                <code className="hash-display block mt-1 text-xs truncate">
                                    {integrity.og_log_hash}
                                </code>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-vault-muted mt-6">
                    Powered by VaultID and 0G Storage Network
                </p>
            </PublicLayout>
        </>
    );
}
