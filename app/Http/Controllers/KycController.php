<?php

namespace App\Http\Controllers;

use App\Enums\IdType;
use App\Http\Requests\VerifyKycRequest;
use App\Services\QoreidService;
use App\Services\VaultService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KycController extends Controller
{
    public function __construct(
        private QoreidService $qoreid,
        private VaultService $vault,
    ) {}

    public function show(Request $request, string $type): Response
    {
        $idType = IdType::from($type);
        $existing = $request->user()->verifications()
            ->where('id_type', $idType)->first();

        return Inertia::render('Verify', [
            'id_type' => $idType->value,
            'label' => $idType->label(),
            'short_label' => $idType->shortLabel(),
            'placeholder' => $idType->placeholder(),
            'needs_dob' => in_array($idType, [IdType::PASSPORT, IdType::DRIVERS_LICENSE, IdType::VOTERS_CARD]),
            'needs_name' => $idType === IdType::VOTERS_CARD,
            'existing' => $existing ? [
                'status' => $existing->status->value,
                'verified_at' => $existing->verified_at?->diffForHumans(),
            ] : null,
        ]);
    }

    public function verify(VerifyKycRequest $request): RedirectResponse
    {
        $user = $request->user();
        $idType = IdType::from($request->id_type);

        if ($user->verifications()->where('id_type', $idType)->where('status', 'verified')->exists()) {
            return back()->withErrors(['id_type' => 'Already verified.']);
        }

        $user->verifications()->where('id_type', $idType)->whereIn('status', ['pending', 'failed'])->delete();

        $verification = $user->verifications()->create([
            'id_type' => $idType,
            'id_number_hash' => hash('sha256', $request->id_number),
            'status' => 'pending',
        ]);

        try {
            $payload = $this->qoreid->buildPayload($idType, $request->validated());
            $qoreidResponse = $this->qoreid->verify($idType, $payload);
            $this->vault->storeVerification($user, $verification, $qoreidResponse);

            return redirect()->route('dashboard')
                ->with('success', $idType->shortLabel().' verified successfully!');
        } catch (\Throwable $e) {
            $verification->update(['status' => 'failed']);

            return back()->withErrors(['verification' => 'Failed: '.$e->getMessage()]);
        }
    }
}
