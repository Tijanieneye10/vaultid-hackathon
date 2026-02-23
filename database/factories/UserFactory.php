<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return fake()->boolean()
            ? [
                'wallet_address' => '0x' . fake()->regexify('[a-fA-F0-9]{40}'),
                'email' => null,
                'password' => null,
            ]
            : [
                'wallet_address' => null,
                'email' => fake()->unique()->safeEmail(),
                'password' => static::$password ??= Hash::make('password'),
            ];
    }

    /**
     * Indicate that the user authenticates via wallet.
     */
    public function withWallet(): static
    {
        return $this->state(fn (array $attributes) => [
            'wallet_address' => '0x' . fake()->regexify('[a-fA-F0-9]{40}'),
            'email' => null,
            'password' => null,
        ]);
    }

    /**
     * Indicate that the user authenticates via email.
     */
    public function withEmail(): static
    {
        return $this->state(fn (array $attributes) => [
            'wallet_address' => null,
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
        ]);
    }
}
