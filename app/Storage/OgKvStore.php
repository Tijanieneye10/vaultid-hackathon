<?php

namespace App\Storage;

use App\Exceptions\OgStorageException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class OgKvStore
{
    public function __construct(private OgNodeBridge $bridge) {}

    /**
     * @return array{merkle_root: string, tx_hash: string}
     */
    public function store(string $key, string $data): array
    {
        try {
            $result = $this->bridge->call('kv-put', [
                'key' => $key,
                'value' => base64_encode($data),
            ]);

            return [
                'merkle_root' => $result['merkle_root'] ?? '',
                'tx_hash' => $result['tx_hash'] ?? '',
            ];
        } catch (OgStorageException $e) {
            Log::warning('0G storage unavailable, using local fallback for store.', [
                'key' => $key,
                'error' => $e->getMessage(),
            ]);

            return $this->localStore($key, $data);
        }
    }

    public function retrieve(string $key): string
    {
        try {
            $result = $this->bridge->call('kv-get', ['key' => $key]);

            return base64_decode($result['value'] ?? '');
        } catch (OgStorageException $e) {
            Log::warning('0G storage unavailable, using local fallback for retrieve.', [
                'key' => $key,
                'error' => $e->getMessage(),
            ]);

            return $this->localRetrieve($key);
        }
    }

    public function verify(string $merkleRoot): bool
    {
        try {
            $result = $this->bridge->call('kv-verify', [
                'merkle_root' => $merkleRoot,
            ]);

            return $result['valid'] ?? false;
        } catch (OgStorageException $e) {
            Log::warning('0G storage unavailable, using local fallback for verify.', [
                'merkle_root' => $merkleRoot,
                'error' => $e->getMessage(),
            ]);

            return $this->localVerify($merkleRoot);
        }
    }

    /**
     * @return array{merkle_root: string, tx_hash: string}
     */
    private function localStore(string $key, string $data): array
    {
        $merkleRoot = hash('sha256', $data);
        $txHash = 'local_' . hash('sha256', $key . now()->timestamp);

        Storage::disk('local')->put(
            "og-fallback/kv/{$this->safePath($key)}",
            $data,
        );

        Storage::disk('local')->put(
            "og-fallback/roots/{$merkleRoot}",
            json_encode(['key' => $key, 'stored_at' => now()->toIso8601String()]),
        );

        return [
            'merkle_root' => $merkleRoot,
            'tx_hash' => $txHash,
        ];
    }

    private function localRetrieve(string $key): string
    {
        $path = "og-fallback/kv/{$this->safePath($key)}";

        if (! Storage::disk('local')->exists($path)) {
            return '';
        }

        return Storage::disk('local')->get($path);
    }

    private function localVerify(string $merkleRoot): bool
    {
        return Storage::disk('local')->exists("og-fallback/roots/{$merkleRoot}");
    }

    private function safePath(string $key): string
    {
        return str_replace(['/', '\\', '..'], '_', $key);
    }
}
