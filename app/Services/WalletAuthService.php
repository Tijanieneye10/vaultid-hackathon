<?php

namespace App\Services;

use App\Exceptions\AuthException;
use App\Models\User;
use Elliptic\EC;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use kornrunner\Keccak;

class WalletAuthService
{
    public function generateNonce(string $address): string
    {
        $nonce = Str::random(32);

        User::updateOrCreate(
            ['wallet_address' => strtolower($address)],
            ['nonce' => $nonce],
        );

        return $nonce;
    }

    public function verify(string $address, string $signature): User
    {
        $user = User::where('wallet_address', strtolower($address))->firstOrFail();

        $message = "Sign in to VaultID\nNonce: ".$user->nonce;

        $prefix = "\x19Ethereum Signed Message:\n".strlen($message);
        $msgHash = Keccak::hash($prefix.$message, 256);

        $sig = hex2bin(str_replace('0x', '', $signature));
        $r = substr($sig, 0, 32);
        $s = substr($sig, 32, 32);
        $v = ord(substr($sig, 64, 1));

        if ($v >= 27) {
            $v -= 27;
        }

        $ec = new EC('secp256k1');
        $pubKey = $ec->recoverPubKey($msgHash, ['r' => bin2hex($r), 's' => bin2hex($s)], $v);
        $pubKeyHex = substr($pubKey->encode('hex'), 2);
        $recovered = '0x'.substr(Keccak::hash(hex2bin($pubKeyHex), 256), -40);

        if (strtolower($recovered) !== strtolower($address)) {
            throw new AuthException('Invalid signature');
        }

        $user->update(['nonce' => Str::random(32)]);
        Auth::login($user);

        return $user;
    }
}
