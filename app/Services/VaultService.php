<?php

namespace App\Services;

use App\Enums\VerificationStatus;
use App\Models\User;
use App\Models\Verification;
use App\Storage\OgKvStore;

class VaultService
{
    public function __construct(
        private OgKvStore $kvStore,
        private AuditService $audit,
    ) {}

    public function storeVerification(
        User $user,
        Verification $verification,
        array $qoreidResponse,
    ): void {
        $plaintext = json_encode($qoreidResponse);
        $encrypted = $this->encrypt($plaintext);

        $kvKey = $user->id.':'.$verification->id_type->value;
        $result = $this->kvStore->store($kvKey, $encrypted);

        $verification->update([
            'og_kv_key' => $kvKey,
            'og_merkle_root' => $result['merkle_root'],
            'status' => VerificationStatus::VERIFIED,
            'verified_at' => now(),
        ]);

        $logHash = $this->audit->log('verification_completed', [
            'user_id' => $user->id,
            'id_type' => $verification->id_type->value,
            'merkle_root' => $result['merkle_root'],
        ]);

        $verification->update(['og_log_hash' => $logHash]);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function retrieveVerification(string $kvKey): ?array
    {
        $encrypted = $this->kvStore->retrieve($kvKey);
        $plaintext = $this->decrypt($encrypted);

        return json_decode($plaintext, true);
    }

    private function encrypt(string $data): string
    {
        $key = config('zerog.encryption_key');
        $nonce = random_bytes(SODIUM_CRYPTO_AEAD_AES256GCM_NPUBBYTES);
        $cipher = sodium_crypto_aead_aes256gcm_encrypt($data, '', $nonce, $key);

        return base64_encode($nonce.$cipher);
    }

    private function decrypt(string $encrypted): string
    {
        $key = config('zerog.encryption_key');
        $decoded = base64_decode($encrypted);
        $nonceSize = SODIUM_CRYPTO_AEAD_AES256GCM_NPUBBYTES;
        $nonce = substr($decoded, 0, $nonceSize);
        $ciphertext = substr($decoded, $nonceSize);

        return sodium_crypto_aead_aes256gcm_decrypt($ciphertext, '', $nonce, $key);
    }
}
