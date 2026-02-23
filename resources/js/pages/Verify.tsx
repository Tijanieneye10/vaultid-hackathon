import { Head, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/components/layout/app-layout';
import type { VerifyPageProps } from '@/types';

interface InputFieldProps {
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
}

function InputField({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
}: InputFieldProps) {
    return (
        <div>
            <label className="block text-sm text-vault-muted mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input-dark"
                placeholder={placeholder}
                required
            />
            {error && <p className="text-xs text-vault-error mt-1">{error}</p>}
        </div>
    );
}

export default function Verify({
    id_type,
    label,
    short_label,
    placeholder,
    needs_dob,
    needs_name,
    existing,
}: VerifyPageProps) {
    const form = useForm<{
        id_type: string;
        id_number: string;
        date_of_birth: string;
        firstname: string;
        lastname: string;
        verification?: string;
    }>({
        id_type,
        id_number: '',
        date_of_birth: '',
        firstname: '',
        lastname: '',
    });

    function submit(e: FormEvent): void {
        e.preventDefault();
        form.post('/verify');
    }

    return (
        <AppLayout>
            <Head title={`Verify ${short_label}`} />

            <div className="max-w-lg mx-auto">
                <button
                    onClick={() => router.visit('/dashboard')}
                    className="flex items-center gap-2 text-vault-muted hover:text-vault-text mb-6 transition-colors"
                >
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
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Back to Dashboard
                </button>

                <div className="glass-card p-8">
                    <h2 className="text-xl font-bold text-vault-text mb-1">
                        Verify {short_label}
                    </h2>
                    <p className="text-sm text-vault-muted mb-6">{label}</p>

                    {existing?.status === 'verified' && (
                        <div className="mb-6 p-4 rounded-xl bg-vault-success-bg border border-vault-success/20 text-vault-success text-sm">
                            Already verified {existing.verified_at}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <InputField
                            label={`${short_label} Number`}
                            value={form.data.id_number}
                            onChange={(v) => form.setData('id_number', v)}
                            placeholder={placeholder}
                            error={form.errors.id_number}
                        />

                        {needs_dob && (
                            <InputField
                                label="Date of Birth"
                                type="date"
                                value={form.data.date_of_birth}
                                onChange={(v) => form.setData('date_of_birth', v)}
                                error={form.errors.date_of_birth}
                            />
                        )}

                        {needs_name && (
                            <>
                                <InputField
                                    label="First Name"
                                    value={form.data.firstname}
                                    onChange={(v) => form.setData('firstname', v)}
                                    error={form.errors.firstname}
                                />
                                <InputField
                                    label="Last Name"
                                    value={form.data.lastname}
                                    onChange={(v) => form.setData('lastname', v)}
                                    error={form.errors.lastname}
                                />
                            </>
                        )}

                        {form.errors.verification && (
                            <p className="text-sm text-vault-error p-3 rounded-xl bg-vault-error-bg border border-vault-error/20">
                                {form.errors.verification}
                            </p>
                        )}

                        {form.errors.id_type && (
                            <p className="text-sm text-vault-error p-3 rounded-xl bg-vault-error-bg border border-vault-error/20">
                                {form.errors.id_type}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="w-full btn-gradient py-3"
                        >
                            {form.processing
                                ? 'Verifying via Qoreid...'
                                : `Verify ${short_label}`}
                        </button>
                    </form>

                    <div className="mt-6 p-4 rounded-xl bg-vault-bg/50 border border-vault-border">
                        <p className="text-xs text-vault-muted leading-relaxed">
                            Your data will be verified via Qoreid, encrypted with AES-256-GCM, and
                            stored on 0G's decentralized storage network. Only you control who can
                            access it.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
