<?php

namespace Database\Factories;

use App\Enums\IdType;
use App\Enums\VerificationStatus;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Verification>
 */
class VerificationFactory extends Factory
{
    protected $model = Verification::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'id_type' => fake()->randomElement(IdType::cases()),
            'id_number_hash' => hash('sha256', fake()->numerify('###########')),
            'status' => VerificationStatus::PENDING,
        ];
    }

    /**
     * Indicate that the verification is verified.
     */
    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VerificationStatus::VERIFIED,
            'verified_at' => now(),
            'og_kv_key' => fake()->uuid() . ':nin',
            'og_merkle_root' => '0x' . fake()->regexify('[a-f0-9]{64}'),
            'og_log_hash' => '0x' . fake()->regexify('[a-f0-9]{64}'),
        ]);
    }

    /**
     * Indicate that the verification has failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VerificationStatus::FAILED,
        ]);
    }
}
