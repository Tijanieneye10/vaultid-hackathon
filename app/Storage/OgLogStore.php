<?php

namespace App\Storage;

use App\Exceptions\OgStorageException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OgLogStore
{
    public function __construct(private OgNodeBridge $bridge) {}

    public function append(array $event): string
    {
        $userId = $event['data']['user_id'] ?? 'system';
        $timestamp = now()->timestamp;
        $key = "audit:{$userId}:{$timestamp}:" . Str::random(8);

        try {
            $result = $this->bridge->call('kv-put', [
                'key' => $key,
                'value' => base64_encode(json_encode($event)),
            ]);

            return $result['tx_hash'] ?? '';
        } catch (OgStorageException $e) {
            Log::warning('0G storage unavailable, using local fallback for audit log.', [
                'key' => $key,
                'error' => $e->getMessage(),
            ]);

            return $this->localAppend($key, $event);
        }
    }

    /**
     * @return array<int, mixed>
     */
    public function getEvents(string $userId): array
    {
        return $this->localGetEvents($userId);
    }

    private function localAppend(string $key, array $event): string
    {
        $txHash = 'local_' . hash('sha256', $key);

        Storage::disk('local')->put(
            "og-fallback/logs/{$this->safePath($key)}.json",
            json_encode($event),
        );

        return $txHash;
    }

    /**
     * @return array<int, mixed>
     */
    private function localGetEvents(string $userId): array
    {
        $prefix = "og-fallback/logs/audit_{$userId}_";
        $files = Storage::disk('local')->files('og-fallback/logs');

        $events = [];
        foreach ($files as $file) {
            if (str_contains($file, "audit_{$userId}_")) {
                $content = Storage::disk('local')->get($file);
                $decoded = json_decode($content, true);
                if ($decoded) {
                    $events[] = $decoded;
                }
            }
        }

        return $events;
    }

    private function safePath(string $key): string
    {
        return str_replace(['/', '\\', '..', ':'], '_', $key);
    }
}
