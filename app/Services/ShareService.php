<?php

namespace App\Services;

use App\Models\ShareLink;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Support\Str;

class ShareService
{
    public function __construct(
        private VaultService $vault,
        private AuditService $audit,
    ) {}

    public function generateHash(
        User $user,
        Verification $verification,
        ?string $label = null,
    ): ShareLink {
        $hash = hash('sha256', $user->id.$verification->id.Str::random(32));
        $shareHash = substr($hash, 0, 32);

        $link = ShareLink::create([
            'user_id' => $user->id,
            'verification_id' => $verification->id,
            'share_hash' => $shareHash,
            'label' => $label,
        ]);

        $this->audit->log('share_link_created', [
            'user_id' => $user->id,
            'share_hash' => $shareHash,
        ]);

        return $link;
    }

    /**
     * Retrieve verified data using a share hash.
     * Open access for hackathon -- anyone with the hash gets the data.
     *
     * @return array<string, mixed>|null
     */
    public function retrieve(string $hash): ?array
    {
        $link = ShareLink::where('share_hash', $hash)
            ->where('is_active', true)
            ->with('verification')
            ->first();

        if (! $link || ! $link->verification->isVerified()) {
            return null;
        }

        $data = $this->vault->retrieveVerification(
            $link->verification->og_kv_key
        );

        if (! $data) {
            return null;
        }

        $link->recordAccess();

        $this->audit->log('share_link_accessed', [
            'share_hash' => $hash,
            'verification_id' => $link->verification_id,
        ]);

        return [
            'status' => 'verified',
            'id_type' => $link->verification->id_type->value,
            'id_type_label' => $link->verification->id_type->shortLabel(),
            'verified_at' => $link->verification->verified_at->toIso8601String(),
            'data' => $data,
            'integrity' => [
                'merkle_root' => $link->verification->og_merkle_root,
                'og_log_hash' => $link->verification->og_log_hash,
                'stored_on' => '0G Storage Network',
            ],
        ];
    }

    public function deactivate(ShareLink $link): void
    {
        $link->update(['is_active' => false]);

        $this->audit->log('share_link_deactivated', [
            'user_id' => $link->user_id,
            'share_hash' => $link->share_hash,
        ]);
    }
}
