<?php

namespace App\Services;

use App\Storage\OgLogStore;

class AuditService
{
    public function __construct(private OgLogStore $logStore) {}

    public function log(string $eventType, array $data = []): string
    {
        return $this->logStore->append([
            'event_type' => $eventType,
            'data' => $data,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * @return array<int, mixed>
     */
    public function getEventsForUser(string $userId): array
    {
        return $this->logStore->getEvents($userId);
    }
}
