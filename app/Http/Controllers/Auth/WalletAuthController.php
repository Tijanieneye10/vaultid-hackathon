<?php

namespace App\Http\Controllers\Auth;

use App\Exceptions\AuthException;
use App\Http\Controllers\Controller;
use App\Services\WalletAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletAuthController extends Controller
{
    public function __construct(private WalletAuthService $walletAuth) {}

    public function nonce(Request $request): JsonResponse
    {
        $request->validate([
            'address' => ['required', 'string', 'size:42'],
        ]);

        $nonce = $this->walletAuth->generateNonce($request->address);

        return response()->json([
            'message' => "Sign in to VaultID\nNonce: ".$nonce,
        ]);
    }

    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'address' => ['required', 'string', 'size:42'],
            'signature' => ['required', 'string'],
        ]);

        try {
            $this->walletAuth->verify($request->address, $request->signature);

            return response()->json([
                'success' => true,
                'redirect' => route('dashboard'),
            ]);
        } catch (AuthException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
