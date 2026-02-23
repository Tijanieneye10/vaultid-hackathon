<?php

namespace App\Services;

use App\Enums\IdType;

class FakeQoreidService extends QoreidService
{
    public function __construct()
    {
        // Skip parent constructor — no API keys needed.
    }

    /**
     * @return array<string, mixed>
     */
    public function verify(IdType $type, array $payload): array
    {
        $faker = fake('en_NG');

        $firstname = $faker->firstName();
        $lastname = $faker->lastName();
        $middlename = $faker->firstName();
        $gender = $faker->randomElement(['male', 'female']);
        $birthdate = $faker->date('Y-m-d', '-25 years');
        $phone = '080'.fake()->numerify('########');

        $applicant = [
            'firstname' => $firstname,
            'lastname' => $lastname,
            'middlename' => $middlename,
            'phone' => $phone,
            'birthdate' => $birthdate,
            'gender' => $gender,
            'photo' => 'https://ui-avatars.com/api/?name='.urlencode($firstname.'+'.$lastname).'&size=200',
            'address' => $faker->address(),
        ];

        $idNumber = $payload['id_number'] ?? $faker->numerify('###########');

        $typeSpecific = match ($type) {
            IdType::NIN => ['nin' => $idNumber],
            IdType::BVN => ['bvn' => $idNumber],
            IdType::PASSPORT => ['passport_number' => $idNumber],
            IdType::DRIVERS_LICENSE => ['license_number' => $idNumber],
            IdType::VOTERS_CARD => ['vin' => $idNumber],
        };

        $summary = $type->shortLabel().' Verified Successfully';

        return [
            'id' => fake()->numberBetween(10000, 99999),
            'applicant' => array_merge($applicant, $typeSpecific),
            'status' => ['status' => 'found', 'state' => 'complete'],
            'summary' => $summary,
        ];
    }
}
