<?php

namespace App\Services;

use App\Enums\IdType;
use App\Exceptions\QoreidException;
use Illuminate\Support\Facades\Http;

class QoreidService
{
    private string $baseUrl;

    private string $secretKey;

    public function __construct()
    {
        $this->baseUrl = config('qoreid.base_url');
        $this->secretKey = config('qoreid.secret_key');
    }

    /**
     * @return array<string, mixed>
     */
    public function verify(IdType $type, array $payload): array
    {
        $endpoint = match ($type) {
            IdType::NIN => '/v1/ng/identities/nin',
            IdType::BVN => '/v1/ng/identities/bvn-basic',
            IdType::PASSPORT => '/v1/ng/identities/passport',
            IdType::DRIVERS_LICENSE => '/v1/ng/identities/drivers-license',
            IdType::VOTERS_CARD => '/v1/ng/identities/vin',
        };

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->secretKey,
        ])->timeout(30)->post($this->baseUrl.$endpoint, $payload);

        if ($response->failed()) {
            throw new QoreidException(
                'Verification failed: '.($response->json('message') ?? 'Unknown error')
            );
        }

        return $response->json();
    }

    /**
     * @return array<string, mixed>
     */
    public function buildPayload(IdType $type, array $input): array
    {
        return match ($type) {
            IdType::NIN => ['id_number' => $input['id_number']],
            IdType::BVN => ['id_number' => $input['id_number']],
            IdType::PASSPORT => [
                'id_number' => $input['id_number'],
                'date_of_birth' => $input['date_of_birth'],
            ],
            IdType::DRIVERS_LICENSE => [
                'id_number' => $input['id_number'],
                'date_of_birth' => $input['date_of_birth'],
            ],
            IdType::VOTERS_CARD => [
                'id_number' => $input['id_number'],
                'firstname' => $input['firstname'],
                'lastname' => $input['lastname'],
                'date_of_birth' => $input['date_of_birth'],
            ],
        };
    }
}
