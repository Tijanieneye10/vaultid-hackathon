<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ShareService;
use App\Storage\OgKvStore;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class PublicVerifyController extends Controller
{
    public function show(string $hash): Response
    {
        $data = app(ShareService::class)->retrieve($hash);

        return Inertia::render('Public/VerifyHash', [
            'verification' => $data,
            'error' => $data ? null : 'Invalid or inactive link.',
        ]);
    }

    public function retrieve(string $hash): JsonResponse
    {
        $data = app(ShareService::class)->retrieve($hash);

        if (! $data) {
            return response()->json(['message' => 'Invalid or inactive link'], 404);
        }

        return response()->json($data);
    }

    public function records(string $hash): JsonResponse
    {
        $data = app(ShareService::class)->retrieve($hash);

        if (! $data) {
            return response()->json(['message' => 'Invalid or inactive link'], 404);
        }

        return response()->json([
            'id_type' => $data['id_type'],
            'id_type_label' => $data['id_type_label'],
            'status' => $data['status'],
            'verified_at' => $data['verified_at'],
            'records' => $data['data'],
        ]);
    }

    public function verifyIntegrity(string $merkleRoot): JsonResponse
    {
        $isValid = app(OgKvStore::class)->verify($merkleRoot);

        return response()->json([
            'merkle_root' => $merkleRoot,
            'is_valid' => $isValid,
            'verified_on' => '0G Storage Network',
        ]);
    }
}
