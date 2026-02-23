export type * from './auth';

export interface VerificationData {
    id: string;
    status: 'pending' | 'verified' | 'failed';
    status_label: string;
    status_color: string;
    verified_at: string | null;
    share_count: number;
    merkle_root: string | null;
}

export interface CardData {
    id_type: string;
    label: string;
    full_label: string;
    icon: string;
    placeholder: string;
    verification: VerificationData | null;
}

export interface DashboardStats {
    total_verified: number;
    active_shares: number;
    total_accesses: number;
}

export interface DashboardUser {
    id: string;
    display_name: string;
    is_wallet: boolean;
    wallet_address: string | null;
}

export interface ShareLinkData {
    id: string;
    share_hash: string;
    url: string;
    label: string | null;
    is_active: boolean;
    access_count: number;
    last_accessed_at: string | null;
    created_at: string;
    id_type: string;
}

export interface AuditEvent {
    id: string;
    event_type: string;
    description: string;
    og_log_hash: string | null;
    created_at: string;
    timestamp: string;
}

export interface VerifyPageProps {
    id_type: string;
    label: string;
    short_label: string;
    placeholder: string;
    needs_dob: boolean;
    needs_name: boolean;
    existing: {
        status: string;
        verified_at: string | null;
    } | null;
}

export interface PublicVerificationData {
    status: string;
    id_type: string;
    id_type_label: string;
    verified_at: string;
    data: {
        applicant?: {
            firstname?: string;
            lastname?: string;
            middlename?: string;
            phone?: string;
            birthdate?: string;
            gender?: string;
            photo?: string;
            address?: string;
        };
        [key: string]: unknown;
    };
    integrity: {
        merkle_root: string;
        og_log_hash: string;
        stored_on: string;
    };
}
