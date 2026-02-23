<?php

namespace App\Http\Controllers;

use App\Enums\IdType;
use App\Enums\VerificationStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user()->load(['verifications.shareLinks']);
        $verificationMap = $user->verifications->keyBy(fn ($v) => $v->id_type->value);

        $cards = collect(IdType::cases())->map(fn (IdType $type) => [
            'id_type' => $type->value,
            'label' => $type->shortLabel(),
            'full_label' => $type->label(),
            'icon' => $type->icon(),
            'placeholder' => $type->placeholder(),
            'verification' => $verificationMap->has($type->value) ? [
                'id' => $verificationMap[$type->value]->id,
                'status' => $verificationMap[$type->value]->status->value,
                'status_label' => $verificationMap[$type->value]->status->label(),
                'status_color' => $verificationMap[$type->value]->status->color(),
                'verified_at' => $verificationMap[$type->value]->verified_at?->diffForHumans(),
                'share_count' => $verificationMap[$type->value]->shareLinks->where('is_active', true)->count(),
                'merkle_root' => $verificationMap[$type->value]->og_merkle_root,
            ] : null,
        ]);

        return Inertia::render('Dashboard', [
            'cards' => $cards,
            'stats' => [
                'total_verified' => $user->verifications->where('status', VerificationStatus::VERIFIED)->count(),
                'active_shares' => $user->shareLinks->where('is_active', true)->count(),
                'total_accesses' => $user->shareLinks->sum('access_count'),
            ],
            'user' => [
                'id' => $user->id,
                'display_name' => $user->displayName(),
                'is_wallet' => $user->isWalletUser(),
                'wallet_address' => $user->wallet_address,
            ],
        ]);
    }
}
