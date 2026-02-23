<?php

namespace Database\Factories;

use App\Models\ShareLink;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ShareLink>
 */
class ShareLinkFactory extends Factory
{
    protected $model = ShareLink::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'verification_id' => Verification::factory(),
            'share_hash' => substr(hash('sha256', fake()->uuid()), 0, 32),
            'label' => fake()->optional()->sentence(3),
            'is_active' => true,
            'access_count' => fake()->numberBetween(0, 50),
            'last_accessed_at' => fake()->optional()->dateTimeBetween('-30 days'),
        ];
    }

    /**
     * Indicate that the share link is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
