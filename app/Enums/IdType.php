<?php

namespace App\Enums;

enum IdType: string
{
    case NIN = 'nin';
    case BVN = 'bvn';
    case PASSPORT = 'passport';
    case DRIVERS_LICENSE = 'drivers_license';
    case VOTERS_CARD = 'voters_card';

    public function label(): string
    {
        return match ($this) {
            self::NIN => 'National Identity Number (NIN)',
            self::BVN => 'Bank Verification Number (BVN)',
            self::PASSPORT => 'International Passport',
            self::DRIVERS_LICENSE => "Driver's License",
            self::VOTERS_CARD => "Voter's Card",
        };
    }

    public function shortLabel(): string
    {
        return match ($this) {
            self::NIN => 'NIN',
            self::BVN => 'BVN',
            self::PASSPORT => 'Passport',
            self::DRIVERS_LICENSE => "Driver's License",
            self::VOTERS_CARD => "Voter's Card",
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::NIN => 'shield-check',
            self::BVN => 'fingerprint',
            self::PASSPORT => 'globe',
            self::DRIVERS_LICENSE => 'car',
            self::VOTERS_CARD => 'vote',
        };
    }

    public function placeholder(): string
    {
        return match ($this) {
            self::NIN => 'Enter 11-digit NIN number',
            self::BVN => 'Enter 11-digit BVN number',
            self::PASSPORT => 'Enter passport number',
            self::DRIVERS_LICENSE => 'Enter license number',
            self::VOTERS_CARD => 'Enter VIN number',
        };
    }

    /**
     * @return string|array<int, string>
     */
    public function validationRule(): string|array
    {
        return match ($this) {
            self::NIN, self::BVN => 'digits:11',
            self::PASSPORT, self::DRIVERS_LICENSE => ['min:6', 'max:20'],
            self::VOTERS_CARD => ['min:6', 'max:25'],
        };
    }
}
