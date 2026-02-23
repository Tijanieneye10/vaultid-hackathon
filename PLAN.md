# VaultID — Laravel Implementation Plan

> **Verify Once. Share a Hash. Done.**
> Laravel 12 + React 19 + Inertia.js + Tailwind CSS 4 + 0G Storage + MySQL

---

## 1. The Complete Flow

1. User connects their MetaMask/OKX wallet **or** signs up with email
2. Dashboard shows verification cards: NIN, BVN, Passport, Driver's License, Voter's Card
3. User clicks "Verify NIN," enters their NIN number → backend calls **Qoreid API** to verify
4. On success, the **full Qoreid response** (name, DOB, photo, address, etc.) is encrypted and stored on **0G Storage**
5. System generates a unique **share hash** (e.g., `vaultid.xyz/v/a3f8c1...`) that the user can copy
6. User shares that hash with any fintech. Fintech calls `GET /api/v1/verify/{hash}` and gets the raw verified data back

No fintech registration. No approval flow. No webhooks. The user controls everything by choosing who they share the hash with. If you have the hash, you can retrieve the data.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────┐
│  React 19 + Inertia.js + Tailwind CSS 4    │
│  (Web3 dark UI, wallet connect)             │
└──────────────────┬──────────────────────────┘
                   │
          ┌────────┴────────────┐
          │  Laravel 12 Backend │
          │  (Sanctum + Inertia)│
          └───┬───────┬───────┬─┘
              │       │       │
     ┌────────┴─┐ ┌───┴───┐ ┌┴────────────┐
     │  MySQL   │ │Qoreid │ │0G Storage    │
     │(metadata)│ │(KYC)  │ │KV + Log      │
     └──────────┘ └───────┘ └──────────────┘
```

**Inertia.js** is the glue — React pages behave like a SPA while Laravel handles routing, auth, and data loading server-side. No separate API layer needed for the frontend. The public verification endpoint remains a standard JSON API for external consumers.

---

## 3. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Laravel 12 | Fast to ship, Eloquent, Sanctum, queues |
| **Frontend** | React 19 + Inertia.js | SPA feel with server-side routing |
| **Styling** | Tailwind CSS 4 | New `@theme` directive, CSS-first config |
| **Auth** | Laravel Sanctum | Session auth for web, tokens for API |
| **Wallet Auth** | `kornrunner/keccak` + `simplito/elliptic-php` | ecrecover for MetaMask/OKX signature verification |
| **KYC Provider** | Qoreid API (Test Mode) | NIN, BVN, Passport, Driver's License, Voter's Card |
| **Storage** | 0G Storage (KV + Log layers) | Decentralized encrypted storage + immutable audit |
| **Database** | MySQL 8+ | Application metadata, user accounts, share links |
| **Queue** | Redis + Laravel Horizon | Async 0G writes |
| **Encryption** | AES-256-GCM (libsodium) | Server-side encryption for hackathon |
| **Web3 Connect** | `window.ethereum` (MetaMask/OKX native) | Wallet connection + message signing |

---

## 4. Project Structure

```
vaultid/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/
│   │   │   │   ├── WalletAuthController.php
│   │   │   │   └── EmailAuthController.php
│   │   │   ├── DashboardController.php
│   │   │   ├── KycController.php
│   │   │   ├── ShareController.php
│   │   │   ├── AuditController.php
│   │   │   └── Api/
│   │   │       └── PublicVerifyController.php
│   │   ├── Middleware/
│   │   │   └── HandleInertiaRequests.php
│   │   └── Requests/
│   │       ├── VerifyKycRequest.php
│   │       └── WalletLoginRequest.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Verification.php
│   │   └── ShareLink.php
│   ├── Services/
│   │   ├── QoreidService.php
│   │   ├── VaultService.php
│   │   ├── ShareService.php
│   │   ├── AuditService.php
│   │   └── WalletAuthService.php
│   ├── Storage/
│   │   ├── OgClient.php            # 0G SDK HTTP wrapper
│   │   ├── OgKvStore.php           # KV layer operations
│   │   └── OgLogStore.php          # Log layer operations
│   ├── Enums/
│   │   ├── IdType.php
│   │   └── VerificationStatus.php
│   ├── Jobs/
│   │   ├── StoreOnZeroG.php
│   │   └── WriteAuditLog.php
│   └── Exceptions/
│       ├── QoreidException.php
│       └── AuthException.php
├── config/
│   ├── qoreid.php
│   └── zerog.php
├── database/
│   ├── migrations/
│   │   ├── 0001_create_users_table.php
│   │   ├── 0002_create_verifications_table.php
│   │   └── 0003_create_share_links_table.php
│   └── seeders/
│       └── DemoSeeder.php
├── resources/
│   ├── js/
│   │   ├── app.jsx                   # Inertia + React bootstrap
│   │   ├── Pages/
│   │   │   ├── Auth/
│   │   │   │   └── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Verify.jsx
│   │   │   ├── Shares.jsx
│   │   │   ├── Audit.jsx
│   │   │   └── Public/
│   │   │       └── VerifyHash.jsx
│   │   ├── Components/
│   │   │   ├── Layout/
│   │   │   │   ├── AppLayout.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── WalletButton.jsx
│   │   │   ├── VerificationCard.jsx
│   │   │   ├── ShareLinkRow.jsx
│   │   │   ├── AuditTimeline.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── CopyHash.jsx
│   │   └── hooks/
│   │       ├── useWallet.js
│   │       └── useClipboard.js
│   └── css/
│       └── app.css                   # Tailwind 4 + @theme
├── routes/
│   ├── web.php
│   └── api.php
├── docker-compose.yml
└── .env
```

---

## 5. Project Scaffolding

### 5.1 Initial Setup

```bash
# Create Laravel project
composer create-project laravel/laravel vaultid
cd vaultid

# Install Inertia server-side
composer require inertiajs/inertia-laravel

# Install React + Inertia frontend
npm install react react-dom @inertiajs/react
npm install -D @vitejs/plugin-react

# Tailwind CSS 4 (new engine, no config file)
npm install tailwindcss @tailwindcss/vite

# Laravel packages
composer require laravel/sanctum

# Wallet signature verification
composer require kornrunner/keccak
composer require simplito/elliptic-php
```

### 5.2 Tailwind CSS 4 Setup

Tailwind CSS 4 uses a CSS-first configuration. No `tailwind.config.js` needed.

```css
/* resources/css/app.css */
@import "tailwindcss";

@theme {
    --color-vault-bg: #0F172A;
    --color-vault-surface: #1E293B;
    --color-vault-card: #1E293B;
    --color-vault-card-hover: #263548;
    --color-vault-border: #334155;
    --color-vault-text: #E2E8F0;
    --color-vault-muted: #94A3B8;
    --color-vault-accent: #7C3AED;
    --color-vault-accent-hover: #6D28D9;
    --color-vault-success: #10B981;
    --color-vault-success-bg: rgba(16, 185, 129, 0.1);
    --color-vault-warning: #F59E0B;
    --color-vault-warning-bg: rgba(245, 158, 11, 0.1);
    --color-vault-error: #EF4444;
    --color-vault-error-bg: rgba(239, 68, 68, 0.1);
    --color-vault-gradient-from: #7C3AED;
    --color-vault-gradient-to: #2563EB;
    --color-vault-glow: rgba(124, 58, 237, 0.15);
    --color-vault-glow-success: rgba(16, 185, 129, 0.15);
    --font-family-mono: 'Fira Code', 'JetBrains Mono', monospace;
}
```

### 5.3 Vite Config

```js
// vite.config.js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
});
```

### 5.4 Inertia + React Bootstrap

```jsx
// resources/js/app.jsx
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';

createInertiaApp({
    title: (title) => (title ? `${title} - VaultID` : 'VaultID'),
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
        return pages[`./Pages/${name}.jsx`];
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: { color: '#7C3AED' },
});
```

### 5.5 Inertia Root View

```blade
<!-- resources/views/app.blade.php -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <link rel="preconnect" href="https://fonts.bunny.net" />
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700|fira-code:400,500" rel="stylesheet" />
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
</head>
<body class="antialiased">
    @inertia
</body>
</html>
```

---

## 6. Database Migrations

### 6.1 Users Table

```php
Schema::create('users', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('wallet_address', 42)->unique()->nullable();
    $table->string('email')->unique()->nullable();
    $table->string('password')->nullable();
    $table->string('nonce', 64)->nullable(); // For wallet sig verify
    $table->rememberToken();
    $table->timestamps();
});
```

### 6.2 Verifications Table

```php
Schema::create('verifications', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
    $table->enum('id_type', ['nin', 'bvn', 'passport', 'drivers_license', 'voters_card']);
    $table->string('id_number_hash', 128);
    $table->enum('status', ['pending', 'verified', 'failed'])->default('pending');
    // 0G Storage references
    $table->string('og_kv_key', 512)->nullable();
    $table->string('og_merkle_root', 512)->nullable();
    $table->string('og_log_hash', 512)->nullable();
    // Qoreid reference
    $table->string('qoreid_ref')->nullable();
    $table->timestamp('verified_at')->nullable();
    $table->timestamps();
    $table->unique(['user_id', 'id_type']);
});
```

### 6.3 Share Links Table

```php
Schema::create('share_links', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('verification_id')->constrained()->cascadeOnDelete();
    $table->string('share_hash', 64)->unique();
    $table->string('label')->nullable();
    $table->boolean('is_active')->default(true);
    $table->unsignedInteger('access_count')->default(0);
    $table->timestamp('last_accessed_at')->nullable();
    $table->timestamps();
    $table->index('share_hash');
});
```

---

## 7. Enums

```php
// app/Enums/IdType.php
enum IdType: string {
    case NIN = 'nin';
    case BVN = 'bvn';
    case PASSPORT = 'passport';
    case DRIVERS_LICENSE = 'drivers_license';
    case VOTERS_CARD = 'voters_card';

    public function label(): string {
        return match ($this) {
            self::NIN => 'National Identity Number (NIN)',
            self::BVN => 'Bank Verification Number (BVN)',
            self::PASSPORT => 'International Passport',
            self::DRIVERS_LICENSE => "Driver's License",
            self::VOTERS_CARD => "Voter's Card",
        };
    }

    public function shortLabel(): string {
        return match ($this) {
            self::NIN => 'NIN',
            self::BVN => 'BVN',
            self::PASSPORT => 'Passport',
            self::DRIVERS_LICENSE => "Driver's License",
            self::VOTERS_CARD => "Voter's Card",
        };
    }

    public function icon(): string {
        return match ($this) {
            self::NIN => 'shield-check',
            self::BVN => 'fingerprint',
            self::PASSPORT => 'globe',
            self::DRIVERS_LICENSE => 'car',
            self::VOTERS_CARD => 'vote',
        };
    }

    public function placeholder(): string {
        return match ($this) {
            self::NIN => 'Enter 11-digit NIN number',
            self::BVN => 'Enter 11-digit BVN number',
            self::PASSPORT => 'Enter passport number',
            self::DRIVERS_LICENSE => 'Enter license number',
            self::VOTERS_CARD => 'Enter VIN number',
        };
    }

    public function validationRule(): string {
        return match ($this) {
            self::NIN, self::BVN => 'digits:11',
            self::PASSPORT => 'string|min:6|max:20',
            self::DRIVERS_LICENSE => 'string|min:6|max:20',
            self::VOTERS_CARD => 'string|min:6|max:25',
        };
    }
}

// app/Enums/VerificationStatus.php
enum VerificationStatus: string {
    case PENDING = 'pending';
    case VERIFIED = 'verified';
    case FAILED = 'failed';

    public function label(): string {
        return match ($this) {
            self::PENDING => 'Pending',
            self::VERIFIED => 'Verified',
            self::FAILED => 'Failed',
        };
    }

    public function color(): string {
        return match ($this) {
            self::PENDING => 'warning',
            self::VERIFIED => 'success',
            self::FAILED => 'error',
        };
    }
}
```

---

## 8. Eloquent Models

### 8.1 User

```php
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids;

    protected $fillable = [
        'wallet_address', 'email', 'password', 'nonce',
    ];

    protected $hidden = ['password', 'nonce', 'remember_token'];

    protected function casts(): array {
        return ['password' => 'hashed'];
    }

    public function verifications(): HasMany {
        return $this->hasMany(Verification::class);
    }

    public function shareLinks(): HasMany {
        return $this->hasMany(ShareLink::class);
    }

    public function isWalletUser(): bool {
        return !is_null($this->wallet_address);
    }

    public function displayName(): string {
        if ($this->wallet_address) {
            return substr($this->wallet_address, 0, 6)
                . '...' . substr($this->wallet_address, -4);
        }
        return $this->email;
    }
}
```

### 8.2 Verification

```php
class Verification extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id', 'id_type', 'id_number_hash', 'status',
        'og_kv_key', 'og_merkle_root', 'og_log_hash',
        'qoreid_ref', 'verified_at',
    ];

    protected function casts(): array {
        return [
            'id_type' => IdType::class,
            'status' => VerificationStatus::class,
            'verified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }

    public function shareLinks(): HasMany {
        return $this->hasMany(ShareLink::class);
    }

    public function isVerified(): bool {
        return $this->status === VerificationStatus::VERIFIED;
    }
}
```

### 8.3 ShareLink

```php
class ShareLink extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id', 'verification_id', 'share_hash',
        'label', 'is_active', 'access_count', 'last_accessed_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_accessed_at' => 'datetime',
    ];

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }

    public function verification(): BelongsTo {
        return $this->belongsTo(Verification::class);
    }

    public function getUrlAttribute(): string {
        return url("/v/{$this->share_hash}");
    }

    public function recordAccess(): void {
        $this->increment('access_count');
        $this->update(['last_accessed_at' => now()]);
    }
}
```

---

## 9. Service Layer

### 9.1 QoreidService

```php
class QoreidService
{
    private string $baseUrl;
    private string $secretKey;

    public function __construct() {
        $this->baseUrl = config('qoreid.base_url');
        $this->secretKey = config('qoreid.secret_key');
    }

    public function verify(IdType $type, array $payload): array
    {
        $endpoint = match ($type) {
            IdType::NIN => '/v1/ng/identities/nin',
            IdType::BVN => '/v1/ng/identities/bvn-basic',
            IdType::PASSPORT => '/v1/ng/identities/passport',
            IdType::DRIVERS_LICENSE => '/v1/ng/identities/drivers-license',
            IdType::VOTERS_CARD => '/v1/ng/identities/vin',
        };

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->timeout(30)->post($this->baseUrl . $endpoint, $payload);

        if ($response->failed()) {
            throw new QoreidException(
                'Verification failed: ' . ($response->json('message') ?? 'Unknown error')
            );
        }

        return $response->json(); // Full Qoreid response stored as-is
    }

    public function buildPayload(IdType $type, array $input): array
    {
        return match ($type) {
            IdType::NIN => ['id_number' => $input['id_number']],
            IdType::BVN => ['id_number' => $input['id_number']],
            IdType::PASSPORT => [
                'id_number' => $input['id_number'],
                'date_of_birth' => $input['date_of_birth'],
            ],
            IdType::DRIVERS_LICENSE => [
                'id_number' => $input['id_number'],
                'date_of_birth' => $input['date_of_birth'],
            ],
            IdType::VOTERS_CARD => [
                'id_number' => $input['id_number'],
                'firstname' => $input['firstname'],
                'lastname' => $input['lastname'],
                'date_of_birth' => $input['date_of_birth'],
            ],
        };
    }
}
```

### 9.2 VaultService (Encrypt + Store on 0G)

```php
class VaultService
{
    public function __construct(
        private OgKvStore $kvStore,
        private AuditService $audit,
    ) {}

    public function storeVerification(
        User $user,
        Verification $verification,
        array $qoreidResponse,
    ): void {
        // 1. Encrypt the full Qoreid response
        $plaintext = json_encode($qoreidResponse);
        $encrypted = $this->encrypt($plaintext);

        // 2. Upload to 0G KV Layer
        $kvKey = $user->id . ':' . $verification->id_type->value;
        $result = $this->kvStore->store($kvKey, $encrypted);

        // 3. Update verification record
        $verification->update([
            'og_kv_key' => $kvKey,
            'og_merkle_root' => $result['merkle_root'],
            'status' => VerificationStatus::VERIFIED,
            'verified_at' => now(),
        ]);

        // 4. Log to 0G immutable audit trail
        $logHash = $this->audit->log('verification_completed', [
            'user_id' => $user->id,
            'id_type' => $verification->id_type->value,
            'merkle_root' => $result['merkle_root'],
        ]);

        $verification->update(['og_log_hash' => $logHash]);
    }

    public function retrieveVerification(string $kvKey): ?array
    {
        $encrypted = $this->kvStore->retrieve($kvKey);
        $plaintext = $this->decrypt($encrypted);
        return json_decode($plaintext, true);
    }

    private function encrypt(string $data): string
    {
        $key = config('zerog.encryption_key');
        $nonce = random_bytes(SODIUM_CRYPTO_AEAD_AES256GCM_NPUBBYTES);
        $cipher = sodium_crypto_aead_aes256gcm_encrypt($data, '', $nonce, $key);
        return base64_encode($nonce . $cipher);
    }

    private function decrypt(string $encrypted): string
    {
        $key = config('zerog.encryption_key');
        $decoded = base64_decode($encrypted);
        $nonceSize = SODIUM_CRYPTO_AEAD_AES256GCM_NPUBBYTES;
        $nonce = substr($decoded, 0, $nonceSize);
        $ciphertext = substr($decoded, $nonceSize);
        return sodium_crypto_aead_aes256gcm_decrypt($ciphertext, '', $nonce, $key);
    }
}
```

### 9.3 ShareService

```php
class ShareService
{
    public function __construct(
        private VaultService $vault,
        private AuditService $audit,
    ) {}

    public function generateHash(
        User $user,
        Verification $verification,
        ?string $label = null,
    ): ShareLink {
        $hash = hash('sha256', $user->id . $verification->id . Str::random(32));
        $shareHash = substr($hash, 0, 32);

        $link = ShareLink::create([
            'user_id' => $user->id,
            'verification_id' => $verification->id,
            'share_hash' => $shareHash,
            'label' => $label,
        ]);

        $this->audit->log('share_link_created', [
            'user_id' => $user->id,
            'share_hash' => $shareHash,
        ]);

        return $link;
    }

    /**
     * Retrieve verified data using a share hash.
     * Open access for hackathon — anyone with the hash gets the data.
     */
    public function retrieve(string $hash): ?array
    {
        $link = ShareLink::where('share_hash', $hash)
            ->where('is_active', true)
            ->with('verification')
            ->first();

        if (!$link || !$link->verification->isVerified()) return null;

        // Fetch + decrypt from 0G
        $data = $this->vault->retrieveVerification(
            $link->verification->og_kv_key
        );

        if (!$data) return null;

        // Track access
        $link->recordAccess();

        // Audit
        $this->audit->log('share_link_accessed', [
            'share_hash' => $hash,
            'verification_id' => $link->verification_id,
        ]);

        return [
            'status' => 'verified',
            'id_type' => $link->verification->id_type->value,
            'id_type_label' => $link->verification->id_type->shortLabel(),
            'verified_at' => $link->verification->verified_at->toIso8601String(),
            'data' => $data,
            'integrity' => [
                'merkle_root' => $link->verification->og_merkle_root,
                'og_log_hash' => $link->verification->og_log_hash,
                'stored_on' => '0G Storage Network',
            ],
        ];
    }

    public function deactivate(ShareLink $link): void
    {
        $link->update(['is_active' => false]);
        $this->audit->log('share_link_deactivated', [
            'user_id' => $link->user_id,
            'share_hash' => $link->share_hash,
        ]);
    }
}
```

### 9.4 WalletAuthService

```php
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

        $message = "Sign in to VaultID\nNonce: " . $user->nonce;

        // Ethereum personal_sign prefix
        $prefix = "\x19Ethereum Signed Message:\n" . strlen($message);
        $msgHash = Keccak::hash($prefix . $message, 256);

        // Parse signature (r, s, v)
        $sig = hex2bin(str_replace('0x', '', $signature));
        $r = substr($sig, 0, 32);
        $s = substr($sig, 32, 32);
        $v = ord(substr($sig, 64, 1));
        if ($v >= 27) $v -= 27;

        // Recover public key → derive address
        $ec = new \Elliptic\EC('secp256k1');
        $pubKey = $ec->recoverPubKey($msgHash, ['r' => bin2hex($r), 's' => bin2hex($s)], $v);
        $pubKeyHex = substr($pubKey->encode('hex'), 2);
        $recovered = '0x' . substr(Keccak::hash(hex2bin($pubKeyHex), 256), -40);

        if (strtolower($recovered) !== strtolower($address)) {
            throw new AuthException('Invalid signature');
        }

        // Rotate nonce to prevent replay
        $user->update(['nonce' => Str::random(32)]);
        Auth::login($user);
        return $user;
    }
}
```

### 9.5 AuditService

```php
class AuditService
{
    public function __construct(private OgLogStore $logStore) {}

    public function log(string $eventType, array $data = []): string
    {
        return $this->logStore->append([
            'event_type' => $eventType,
            'data' => $data,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function getEventsForUser(string $userId): array
    {
        return $this->logStore->getEvents($userId);
    }
}
```

---

## 10. 0G Storage Integration

Since 0G's official SDK is in Go and TypeScript, we interact with 0G from Laravel via **HTTP using Guzzle** to the JSON-RPC endpoints.

### 10.1 OgClient (Base HTTP Client)

```php
class OgClient
{
    private string $indexerRpc;
    private string $blockchainRpc;

    public function __construct() {
        $this->indexerRpc = config('zerog.indexer_rpc');
        $this->blockchainRpc = config('zerog.blockchain_rpc');
    }

    public function indexerCall(string $method, array $params = []): array
    {
        $response = Http::timeout(30)->post($this->indexerRpc, [
            'jsonrpc' => '2.0',
            'method' => $method,
            'params' => $params,
            'id' => 1,
        ]);

        if ($response->failed()) {
            throw new \RuntimeException('0G call failed: ' . $method);
        }

        return $response->json();
    }
}
```

### 10.2 OgKvStore

```php
class OgKvStore
{
    public function __construct(private OgClient $client) {}

    public function store(string $key, string $data): array
    {
        $result = $this->client->indexerCall('kv_put', [
            'key' => $key,
            'value' => base64_encode($data),
        ]);
        return [
            'merkle_root' => $result['result']['merkle_root'],
            'tx_hash' => $result['result']['tx_hash'],
        ];
    }

    public function retrieve(string $key): string
    {
        $result = $this->client->indexerCall('kv_get', ['key' => $key]);
        return base64_decode($result['result']['value']);
    }

    public function verify(string $merkleRoot): bool
    {
        $result = $this->client->indexerCall('kv_verify', [
            'merkle_root' => $merkleRoot,
        ]);
        return $result['result']['valid'] ?? false;
    }
}
```

### 10.3 OgLogStore (Immutable Audit Trail)

```php
class OgLogStore
{
    public function __construct(private OgClient $client) {}

    public function append(array $event): string
    {
        $result = $this->client->indexerCall('log_append', [
            'data' => base64_encode(json_encode($event)),
        ]);
        return $result['result']['log_hash'];
    }

    public function getEvents(string $userId): array
    {
        $result = $this->client->indexerCall('log_query', [
            'filter' => ['user_id' => $userId],
        ]);
        return $result['result']['events'] ?? [];
    }
}
```

### 10.4 Config Files

```php
// config/qoreid.php
return [
    'base_url' => env('QOREID_BASE_URL', 'https://api.qoreid.com'),
    'secret_key' => env('QOREID_SECRET_KEY'),
    'client_id' => env('QOREID_CLIENT_ID'),
];

// config/zerog.php
return [
    'indexer_rpc' => env('OG_INDEXER_RPC', 'https://indexer-storage-testnet.0g.ai'),
    'blockchain_rpc' => env('OG_BLOCKCHAIN_RPC', 'https://evmrpc-testnet.0g.ai'),
    'private_key' => env('OG_PRIVATE_KEY'),
    'flow_contract' => env('OG_FLOW_CONTRACT'),
    'encryption_key' => env('OG_ENCRYPTION_KEY') ? base64_decode(env('OG_ENCRYPTION_KEY')) : null,
];
```

---

## 11. Routes

### 11.1 Web Routes (Inertia Pages)

```php
// routes/web.php

// Public verification page
Route::get('/v/{hash}', [PublicVerifyController::class, 'show'])->name('verify.public');

// Auth (Guest)
Route::middleware('guest')->group(function () {
    Route::get('/login', [EmailAuthController::class, 'create'])->name('login');
    Route::post('/login', [EmailAuthController::class, 'store']);
    Route::post('/register', [EmailAuthController::class, 'register']);
    Route::post('/auth/wallet/nonce', [WalletAuthController::class, 'nonce']);
    Route::post('/auth/wallet/verify', [WalletAuthController::class, 'verify']);
});

Route::post('/logout', [EmailAuthController::class, 'destroy'])->middleware('auth')->name('logout');

// Authenticated
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/verify/{type}', [KycController::class, 'show'])->name('kyc.show');
    Route::post('/verify', [KycController::class, 'verify'])->name('kyc.verify');
    Route::get('/shares', [ShareController::class, 'index'])->name('shares.index');
    Route::post('/shares', [ShareController::class, 'store'])->name('shares.store');
    Route::delete('/shares/{shareLink}', [ShareController::class, 'destroy'])->name('shares.destroy');
    Route::get('/audit', [AuditController::class, 'index'])->name('audit.index');
});
```

### 11.2 API Routes (Public Retrieval for Fintechs)

```php
// routes/api.php
Route::prefix('v1')->group(function () {
    Route::get('/verify/{hash}', [PublicVerifyController::class, 'retrieve']);
    Route::get('/integrity/{merkleRoot}', [PublicVerifyController::class, 'verifyIntegrity']);
});
```

---

## 12. Key Controllers

### 12.1 DashboardController

```php
public function index(Request $request)
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
```

### 12.2 KycController

```php
public function __construct(
    private QoreidService $qoreid,
    private VaultService $vault,
) {}

public function show(Request $request, string $type)
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

public function verify(VerifyKycRequest $request)
{
    $user = $request->user();
    $idType = IdType::from($request->id_type);

    // Check existing
    if ($user->verifications()->where('id_type', $idType)->where('status', 'verified')->exists()) {
        return back()->withErrors(['id_type' => 'Already verified.']);
    }

    // Delete failed/pending
    $user->verifications()->where('id_type', $idType)->whereIn('status', ['pending', 'failed'])->delete();

    // Create pending
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
            ->with('success', $idType->shortLabel() . ' verified successfully!');
    } catch (\Throwable $e) {
        $verification->update(['status' => 'failed']);
        return back()->withErrors(['verification' => 'Failed: ' . $e->getMessage()]);
    }
}
```

### 12.3 ShareController

```php
public function index(Request $request)
{
    $links = $request->user()->shareLinks()->with('verification')
        ->orderByDesc('created_at')->get()
        ->map(fn (ShareLink $link) => [
            'id' => $link->id,
            'share_hash' => $link->share_hash,
            'url' => $link->url,
            'label' => $link->label,
            'is_active' => $link->is_active,
            'access_count' => $link->access_count,
            'last_accessed_at' => $link->last_accessed_at?->diffForHumans(),
            'created_at' => $link->created_at->diffForHumans(),
            'id_type' => $link->verification->id_type->shortLabel(),
        ]);

    return Inertia::render('Shares', ['links' => $links]);
}

public function store(Request $request)
{
    $request->validate([
        'verification_id' => 'required|uuid',
        'label' => 'nullable|string|max:255',
    ]);

    $verification = Verification::where('id', $request->verification_id)
        ->where('user_id', $request->user()->id)
        ->where('status', 'verified')
        ->firstOrFail();

    $link = app(ShareService::class)->generateHash(
        $request->user(), $verification, $request->label
    );

    return back()->with('success', 'Share link created!');
}

public function destroy(Request $request, ShareLink $shareLink)
{
    if ($shareLink->user_id !== $request->user()->id) abort(403);
    app(ShareService::class)->deactivate($shareLink);
    return back()->with('success', 'Share link deactivated.');
}
```

### 12.4 PublicVerifyController

```php
// Inertia page for browser visits: GET /v/{hash}
public function show(string $hash)
{
    $data = app(ShareService::class)->retrieve($hash);
    return Inertia::render('Public/VerifyHash', [
        'verification' => $data,
        'error' => $data ? null : 'Invalid or inactive link.',
    ]);
}

// JSON API for fintechs: GET /api/v1/verify/{hash}
public function retrieve(string $hash)
{
    $data = app(ShareService::class)->retrieve($hash);
    if (!$data) return response()->json(['message' => 'Invalid or inactive link'], 404);
    return response()->json($data);
}

// Integrity check: GET /api/v1/integrity/{merkleRoot}
public function verifyIntegrity(string $merkleRoot)
{
    $isValid = app(OgKvStore::class)->verify($merkleRoot);
    return response()->json([
        'merkle_root' => $merkleRoot,
        'is_valid' => $isValid,
        'verified_on' => '0G Storage Network',
    ]);
}
```

### 12.5 API Response Format

When a fintech hits `GET /api/v1/verify/{hash}`, they get:

```json
{
    "status": "verified",
    "id_type": "nin",
    "id_type_label": "NIN",
    "verified_at": "2026-02-22T10:30:00Z",
    "data": {
        "id": 12345,
        "applicant": {
            "firstname": "John",
            "lastname": "Doe",
            "middlename": "Chukwu",
            "phone": "08012345678",
            "birthdate": "1990-05-15",
            "gender": "male",
            "photo": "base64_or_url...",
            "address": "123 Lagos Street..."
        },
        "nin": "12345678901",
        "status": { "status": "found", "state": "complete" },
        "summary": "NIN Verified Successfully"
    },
    "integrity": {
        "merkle_root": "0xabc123...",
        "og_log_hash": "0xdef456...",
        "stored_on": "0G Storage Network"
    }
}
```

---

## 13. Verification Form Request

```php
class VerifyKycRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $rules = [
            'id_type' => ['required', Rule::enum(IdType::class)],
            'id_number' => ['required', 'string'],
        ];

        $type = IdType::tryFrom($this->id_type ?? '');

        if ($type) {
            $rules['id_number'][] = $type->validationRule();
        }

        if (in_array($type, [IdType::PASSPORT, IdType::DRIVERS_LICENSE, IdType::VOTERS_CARD])) {
            $rules['date_of_birth'] = 'required|date|before:today';
        }

        if ($type === IdType::VOTERS_CARD) {
            $rules['firstname'] = 'required|string|max:100';
            $rules['lastname'] = 'required|string|max:100';
        }

        return $rules;
    }
}
```

---

## 14. Qoreid Verification Types

| ID Type | Qoreid Endpoint | User Input |
|---------|----------------|------------|
| NIN | `POST /v1/ng/identities/nin` | 11-digit NIN number |
| BVN | `POST /v1/ng/identities/bvn-basic` | 11-digit BVN number |
| Passport | `POST /v1/ng/identities/passport` | Passport number + DOB |
| Driver's License | `POST /v1/ng/identities/drivers-license` | License number + DOB |
| Voter's Card | `POST /v1/ng/identities/vin` | VIN number + name + DOB |

---

## 15. What Gets Stored Where

| Storage | What | Why |
|---------|------|-----|
| **MySQL** | User account, verification metadata (status, timestamps, 0G refs), share links | Fast queries, relational data, indexing |
| **0G KV Layer** | Full encrypted Qoreid response JSON per verification | Decentralized, user-owned. THE KYC data. |
| **0G Log Layer** | Immutable audit events: verified, shared, accessed, revoked | Tamper-proof trail. Cannot be deleted. |

---

## 16. Frontend Pages (React + Inertia)

### 16.1 Web3 Dark Theme Design System

- **Background:** `bg-vault-bg` (#0F172A) — deep navy, not pure black
- **Cards:** `bg-vault-surface` with `border-vault-border`, `rounded-2xl`, `backdrop-blur-sm` for glassmorphism
- **Buttons:** `bg-gradient-to-r from-vault-gradient-from to-vault-gradient-to` with hover glow
- **Text:** `text-vault-text` for primary, `text-vault-muted` for secondary
- **Accents:** Neon purple (`vault-accent`) for active states, green for verified badges
- **Typography:** Inter (sans-serif), Fira Code for hashes and addresses
- **Card hover glow:** `shadow-[0_0_30px_rgba(124,58,237,0.15)]` transition
- **Status badges:** Pill-shaped with animated pulse dot — green for verified, amber for pending

### 16.2 CSS Utility Classes

```css
.glass-card        → bg-vault-surface/80 backdrop-blur-xl border border-vault-border rounded-2xl
.gradient-text     → bg-gradient-to-r from-vault-gradient-from to-vault-gradient-to bg-clip-text text-transparent
.btn-gradient      → Gradient background with glow hover
.btn-outline       → Accent border with accent text, hover fill
.card-glow         → Purple glow on hover
.card-glow-success → Green glow for verified cards
.hash-display      → Monospace, dark bg, subtle border — for hashes/addresses
.badge-verified    → Green bg/text pill
.badge-pending     → Amber bg/text pill
.input-dark        → Dark input with accent focus ring
```

### 16.3 Page Descriptions

| Page | Description |
|------|-------------|
| **Login.jsx** | Dark fullscreen, centered card. Two tabs: "Connect Wallet" (MetaMask/OKX via `window.ethereum`) and "Email" (form with `useForm` hook). Gradient CTA. Animated background grid. |
| **Dashboard.jsx** | Stats row (3 glass cards: verified, shares, accesses with `useState` animated counters). Grid of `<VerificationCard>` components. Each card: icon, status badge, "Verify" or "Share" button. Verified cards have green glow border. |
| **Verify.jsx** | Back arrow to dashboard. Glass card with ID type header, conditional input fields, `useForm` submit with loading spinner. Error display. Info box about 0G encryption. |
| **Shares.jsx** | List of share links. Each row: label, hash (monospace + copy button using `useClipboard` hook with toast), access count, created date, deactivate button. Empty state. |
| **Audit.jsx** | Vertical timeline. Events color-coded: purple=verification, blue=share, green=access, red=deactivation. Each shows 0G log hash in monospace. |
| **Public/VerifyHash.jsx** | Public (no auth). Verified data card: photo, name, DOB, ID type badge, verification date. "Verified via VaultID" header with 0G badge. Integrity section with Merkle root. 404 illustration if invalid. |

### 16.4 AppLayout.jsx

```jsx
import { Link, usePage } from '@inertiajs/react';

export default function AppLayout({ children }) {
    const { auth, flash } = usePage().props;

    return (
        <div className="min-h-screen bg-vault-bg flex">
            {/* Sidebar */}
            <aside className="fixed w-64 h-full bg-vault-surface border-r border-vault-border z-30">
                <div className="p-6">
                    <Link href="/dashboard">
                        <h1 className="text-2xl font-bold gradient-text">VaultID</h1>
                        <p className="text-xs text-vault-muted mt-1">Decentralized KYC Vault</p>
                    </Link>
                </div>
                <nav className="mt-4 space-y-1 px-3">
                    <SidebarLink href="/dashboard" icon="grid" label="Dashboard" />
                    <SidebarLink href="/shares" icon="share" label="Shared Links" />
                    <SidebarLink href="/audit" icon="clock" label="Audit Trail" />
                </nav>
                <div className="absolute bottom-6 left-3 right-3">
                    <div className="glass-card p-3 text-center">
                        <p className="text-xs text-vault-muted">Powered by</p>
                        <p className="text-sm font-bold text-vault-accent">0G Storage Network</p>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="ml-64 flex-1 min-h-screen">
                <header className="sticky top-0 z-20 bg-vault-bg/80 backdrop-blur-xl border-b border-vault-border">
                    <div className="flex items-center justify-between px-8 py-4">
                        <div />
                        <div className="flex items-center gap-4">
                            <span className="hash-display">{auth?.user?.display_name}</span>
                            <Link href="/logout" method="post" as="button"
                                className="text-sm text-vault-muted hover:text-vault-error transition-colors">
                                Disconnect
                            </Link>
                        </div>
                    </div>
                </header>
                <div className="p-8">
                    {flash?.success && (
                        <div className="mb-6 p-4 rounded-xl bg-vault-success-bg border border-vault-success/20 text-vault-success text-sm">
                            {flash.success}
                        </div>
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
}
```

### 16.5 Dashboard.jsx

```jsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '../Components/Layout/AppLayout';
import VerificationCard from '../Components/VerificationCard';

export default function Dashboard({ cards, stats, user }) {
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedVerificationId, setSelectedVerificationId] = useState(null);
    const [shareLabel, setShareLabel] = useState('');

    function openShareModal(verificationId) {
        setSelectedVerificationId(verificationId);
        setShareLabel('');
        setShowShareModal(true);
    }

    function generateShare() {
        router.post('/shares', {
            verification_id: selectedVerificationId,
            label: shareLabel || null,
        }, { onSuccess: () => setShowShareModal(false) });
    }

    return (
        <AppLayout>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Verified IDs" value={stats.total_verified} />
                <StatCard label="Active Shares" value={stats.active_shares} />
                <StatCard label="Total Accesses" value={stats.total_accesses} />
            </div>

            <h2 className="text-xl font-bold text-vault-text mb-6">Identity Verifications</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <VerificationCard
                        key={card.id_type}
                        card={card}
                        onShare={openShareModal}
                    />
                ))}
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowShareModal(false)} />
                    <div className="relative glass-card p-8 w-full max-w-md mx-4">
                        <h3 className="text-lg font-bold text-vault-text mb-4">Generate Share Link</h3>
                        <p className="text-sm text-vault-muted mb-6">
                            Create a link anyone can use to verify your identity.
                        </p>
                        <input value={shareLabel} onChange={(e) => setShareLabel(e.target.value)}
                            className="input-dark mb-6" placeholder="Label (optional, e.g. 'For Kuda Bank')" />
                        <div className="flex gap-3">
                            <button onClick={() => setShowShareModal(false)} className="flex-1 btn-outline">Cancel</button>
                            <button onClick={generateShare} className="flex-1 btn-gradient">Generate</button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="glass-card p-6 card-glow">
            <p className="text-vault-muted text-sm mb-1">{label}</p>
            <p className="text-3xl font-bold gradient-text">{value}</p>
        </div>
    );
}
```

### 16.6 Login.jsx

```jsx
import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';

export default function Login() {
    const [activeTab, setActiveTab] = useState('wallet');
    const [isRegistering, setIsRegistering] = useState(false);
    const [walletConnecting, setWalletConnecting] = useState(false);
    const [walletError, setWalletError] = useState('');

    const emailForm = useForm({ email: '', password: '', password_confirmation: '' });

    async function connectWallet() {
        setWalletConnecting(true);
        setWalletError('');
        try {
            if (!window.ethereum) { setWalletError('No wallet detected.'); return; }

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const address = accounts[0];
            const csrf = document.querySelector('meta[name="csrf-token"]')?.content;

            const { message } = await fetch('/auth/wallet/nonce', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({ address }),
            }).then(r => r.json());

            const signature = await window.ethereum.request({
                method: 'personal_sign', params: [message, address],
            });

            const result = await fetch('/auth/wallet/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({ address, signature }),
            }).then(r => r.json());

            if (result.success) router.visit(result.redirect);
            else setWalletError(result.message || 'Authentication failed');
        } catch (err) {
            setWalletError(err.message || 'Wallet connection failed');
        } finally {
            setWalletConnecting(false);
        }
    }

    function submitEmail(e) {
        e.preventDefault();
        if (isRegistering) emailForm.post('/register');
        else emailForm.post('/login');
    }

    return (
        <div className="min-h-screen bg-vault-bg flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
            <div className="relative w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold gradient-text mb-2">VaultID</h1>
                    <p className="text-vault-muted">Verify once. Share a hash. Done.</p>
                </div>
                <div className="glass-card p-8">
                    {/* Tab Switcher */}
                    <div className="flex mb-8 bg-vault-bg rounded-xl p-1">
                        <button onClick={() => setActiveTab('wallet')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'wallet' ? 'bg-vault-accent text-white' : 'text-vault-muted'}`}>
                            Connect Wallet
                        </button>
                        <button onClick={() => setActiveTab('email')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'email' ? 'bg-vault-accent text-white' : 'text-vault-muted'}`}>
                            Email
                        </button>
                    </div>

                    {activeTab === 'wallet' ? (
                        <div className="space-y-6">
                            <button onClick={connectWallet} disabled={walletConnecting}
                                className="w-full btn-gradient py-3">
                                {walletConnecting ? 'Connecting...' : 'Connect MetaMask / OKX'}
                            </button>
                            {walletError && <p className="text-sm text-vault-error text-center">{walletError}</p>}
                            <p className="text-xs text-vault-muted text-center">Supports MetaMask, OKX and EVM wallets</p>
                        </div>
                    ) : (
                        <form onSubmit={submitEmail} className="space-y-4">
                            <InputField label="Email" type="email" value={emailForm.data.email}
                                onChange={v => emailForm.setData('email', v)} error={emailForm.errors.email} />
                            <InputField label="Password" type="password" value={emailForm.data.password}
                                onChange={v => emailForm.setData('password', v)} />
                            {isRegistering && (
                                <InputField label="Confirm Password" type="password" value={emailForm.data.password_confirmation}
                                    onChange={v => emailForm.setData('password_confirmation', v)} />
                            )}
                            <button type="submit" disabled={emailForm.processing} className="w-full btn-gradient py-3">
                                {emailForm.processing ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In')}
                            </button>
                            <button type="button" onClick={() => setIsRegistering(!isRegistering)}
                                className="w-full text-sm text-vault-muted hover:text-vault-accent transition-colors">
                                {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                            </button>
                        </form>
                    )}
                </div>
                <p className="text-center text-xs text-vault-muted mt-6">Secured by 0G Decentralized Storage</p>
            </div>
        </div>
    );
}

function InputField({ label, type, value, onChange, error }) {
    return (
        <div>
            <label className="block text-sm text-vault-muted mb-1.5">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} className="input-dark" />
            {error && <p className="text-xs text-vault-error mt-1">{error}</p>}
        </div>
    );
}
```

### 16.7 Verify.jsx

```jsx
import { useForm, router } from '@inertiajs/react';
import AppLayout from '../Components/Layout/AppLayout';

export default function Verify({ id_type, label, short_label, placeholder, needs_dob, needs_name, existing }) {
    const form = useForm({
        id_type, id_number: '', date_of_birth: '', firstname: '', lastname: '',
    });

    function submit(e) {
        e.preventDefault();
        form.post('/verify');
    }

    return (
        <AppLayout>
            <div className="max-w-lg mx-auto">
                <button onClick={() => router.visit('/dashboard')}
                    className="flex items-center gap-2 text-vault-muted hover:text-vault-text mb-6 transition-colors">
                    ← Back to Dashboard
                </button>
                <div className="glass-card p-8">
                    <h2 className="text-xl font-bold text-vault-text mb-1">Verify {short_label}</h2>
                    <p className="text-sm text-vault-muted mb-6">{label}</p>

                    {existing?.status === 'verified' && (
                        <div className="mb-6 p-4 rounded-xl bg-vault-success-bg border border-vault-success/20 text-vault-success text-sm">
                            Already verified {existing.verified_at}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <InputField label={`${short_label} Number`} value={form.data.id_number}
                            onChange={v => form.setData('id_number', v)} placeholder={placeholder}
                            error={form.errors.id_number} />

                        {needs_dob && <InputField label="Date of Birth" type="date" value={form.data.date_of_birth}
                            onChange={v => form.setData('date_of_birth', v)} error={form.errors.date_of_birth} />}

                        {needs_name && <>
                            <InputField label="First Name" value={form.data.firstname}
                                onChange={v => form.setData('firstname', v)} />
                            <InputField label="Last Name" value={form.data.lastname}
                                onChange={v => form.setData('lastname', v)} />
                        </>}

                        {form.errors.verification && (
                            <p className="text-sm text-vault-error p-3 rounded-xl bg-vault-error-bg border border-vault-error/20">
                                {form.errors.verification}
                            </p>
                        )}

                        <button type="submit" disabled={form.processing} className="w-full btn-gradient py-3">
                            {form.processing ? 'Verifying via Qoreid...' : `Verify ${short_label}`}
                        </button>
                    </form>

                    <div className="mt-6 p-4 rounded-xl bg-vault-bg/50 border border-vault-border">
                        <p className="text-xs text-vault-muted leading-relaxed">
                            Your data will be verified via Qoreid, encrypted with AES-256-GCM,
                            and stored on 0G's decentralized storage network.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function InputField({ label, type = 'text', value, onChange, placeholder, error }) {
    return (
        <div>
            <label className="block text-sm text-vault-muted mb-1.5">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)}
                className="input-dark" placeholder={placeholder} required />
            {error && <p className="text-xs text-vault-error mt-1">{error}</p>}
        </div>
    );
}
```

### 16.8 Shares.jsx

```jsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '../Components/Layout/AppLayout';

export default function Shares({ links }) {
    const [copiedHash, setCopiedHash] = useState(null);

    async function copy(url, hash) {
        await navigator.clipboard.writeText(url);
        setCopiedHash(hash);
        setTimeout(() => setCopiedHash(null), 2000);
    }

    function deactivate(id) {
        if (confirm('Deactivate this link? Anyone using it will lose access.')) {
            router.delete(`/shares/${id}`);
        }
    }

    return (
        <AppLayout>
            <h1 className="text-2xl font-bold text-vault-text mb-2">Shared Links</h1>
            <p className="text-vault-muted mb-8">Manage your verification share links</p>

            {links.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <h3 className="text-lg font-semibold text-vault-text mb-2">No share links yet</h3>
                    <p className="text-vault-muted text-sm mb-6">Verify an ID, then generate a share link.</p>
                    <button onClick={() => router.visit('/dashboard')} className="btn-gradient">Go to Dashboard</button>
                </div>
            ) : (
                <div className="space-y-4">
                    {links.map((link) => (
                        <div key={link.id} className={`glass-card p-5 flex items-center justify-between gap-4 ${!link.is_active ? 'opacity-50' : ''}`}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`badge ${link.is_active ? 'badge-verified' : 'badge-unverified'}`}>
                                        {link.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className="text-sm font-medium text-vault-text">{link.id_type}</span>
                                    {link.label && <span className="text-sm text-vault-muted">· {link.label}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="hash-display truncate block flex-1">{link.url}</code>
                                    <button onClick={() => copy(link.url, link.share_hash)}
                                        className={`shrink-0 p-2 rounded-lg hover:bg-vault-accent/10 transition-colors ${copiedHash === link.share_hash ? 'text-vault-success' : 'text-vault-muted'}`}>
                                        {copiedHash === link.share_hash ? '✓' : '📋'}
                                    </button>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-vault-muted">
                                    <span>{link.access_count} access{link.access_count !== 1 ? 'es' : ''}</span>
                                    {link.last_accessed_at && <span>Last: {link.last_accessed_at}</span>}
                                    <span>Created {link.created_at}</span>
                                </div>
                            </div>
                            {link.is_active && (
                                <button onClick={() => deactivate(link.id)}
                                    className="shrink-0 p-2 rounded-lg text-vault-muted hover:text-vault-error hover:bg-vault-error-bg transition-colors"
                                    title="Deactivate">⊘</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
```

### 16.9 Public/VerifyHash.jsx

```jsx
export default function VerifyHash({ verification, error }) {
    if (error || !verification) {
        return (
            <PublicLayout>
                <div className="glass-card p-12 text-center">
                    <h3 className="text-lg font-semibold text-vault-text mb-2">Link Invalid</h3>
                    <p className="text-vault-muted text-sm">{error || 'This link is invalid or deactivated.'}</p>
                </div>
            </PublicLayout>
        );
    }

    const { data, id_type_label, verified_at, integrity } = verification;
    const applicant = data?.applicant || data;

    return (
        <PublicLayout>
            {/* Status banner */}
            <div className="glass-card p-5 text-center border-vault-success/30 mb-4">
                <span className="text-lg font-bold text-vault-success">✓ Identity Verified</span>
                <p className="text-xs text-vault-muted mt-1">via VaultID on 0G Storage Network</p>
            </div>

            {/* Data card */}
            <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <span className="badge badge-verified">{id_type_label} Verified</span>
                    <span className="text-xs text-vault-muted">
                        {new Date(verified_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>

                {applicant?.photo && (
                    <img src={applicant.photo} alt="Photo" className="w-24 h-24 rounded-xl object-cover border border-vault-border" />
                )}

                <div className="grid grid-cols-2 gap-4">
                    {applicant?.firstname && <Field label="First Name" value={applicant.firstname} />}
                    {applicant?.lastname && <Field label="Last Name" value={applicant.lastname} />}
                    {applicant?.middlename && <Field label="Middle Name" value={applicant.middlename} />}
                    {applicant?.birthdate && <Field label="Date of Birth" value={applicant.birthdate} />}
                    {applicant?.gender && <Field label="Gender" value={applicant.gender} />}
                    {applicant?.phone && <Field label="Phone" value={applicant.phone} />}
                </div>
                {applicant?.address && <Field label="Address" value={applicant.address} />}
            </div>

            {/* Integrity proof */}
            <div className="glass-card p-6 mt-4">
                <h3 className="text-sm font-semibold text-vault-text mb-3">Integrity Proof</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-vault-muted">Storage</span>
                        <span className="text-vault-accent">{integrity.stored_on}</span>
                    </div>
                    <div>
                        <span className="text-xs text-vault-muted">Merkle Root</span>
                        <code className="hash-display block mt-1 text-xs truncate">{integrity.merkle_root}</code>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

function PublicLayout({ children }) {
    return (
        <div className="min-h-screen bg-vault-bg flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
            <div className="relative w-full max-w-lg">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold gradient-text">VaultID</h1>
                    <p className="text-xs text-vault-muted mt-1">Verified Identity Data</p>
                </div>
                {children}
            </div>
        </div>
    );
}

function Field({ label, value }) {
    return (
        <div>
            <p className="text-xs text-vault-muted">{label}</p>
            <p className="text-sm text-vault-text font-medium">{value}</p>
        </div>
    );
}
```

### 16.10 Custom Hooks

```js
// resources/js/hooks/useWallet.js
import { useState, useCallback } from 'react';

export function useWallet() {
    const [address, setAddress] = useState(null);
    const [connecting, setConnecting] = useState(false);

    const connect = useCallback(async () => {
        if (!window.ethereum) throw new Error('No wallet detected');
        setConnecting(true);
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAddress(accounts[0]);
            return accounts[0];
        } finally {
            setConnecting(false);
        }
    }, []);

    const sign = useCallback(async (message, addr) => {
        return window.ethereum.request({ method: 'personal_sign', params: [message, addr] });
    }, []);

    return { address, connecting, connect, sign };
}

// resources/js/hooks/useClipboard.js
import { useState, useCallback } from 'react';

export function useClipboard(timeout = 2000) {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(async (text) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
    }, [timeout]);

    return { copied, copy };
}
```

---

## 17. HandleInertiaRequests Middleware

```php
// app/Http/Middleware/HandleInertiaRequests.php
class HandleInertiaRequests extends Middleware
{
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'display_name' => $request->user()->displayName(),
                    'is_wallet' => $request->user()->isWalletUser(),
                    'wallet_address' => $request->user()->wallet_address,
                    'email' => $request->user()->email,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}
```

---

## 18. Day-by-Day Build Order

### Day 1: Scaffold + Auth

- `composer create-project laravel/laravel vaultid`, install Inertia (React adapter) + Tailwind 4
- Set up Tailwind 4 `@theme` with Web3 dark color tokens in `app.css`
- Create `app.blade.php` root view with `@viteReactRefresh`
- `AppLayout.jsx` with sidebar, gradient logo, dark theme
- Run migrations for users table (MySQL)
- Email auth: register + login with Sanctum session cookies
- Wallet auth: nonce endpoint, sig verification with `kornrunner/keccak` + `elliptic-php`
- `Login.jsx` with wallet connect tab + email tab
- `Dashboard.jsx` shell with empty VerificationCard grid

**Deliverable:** User can register/login via MetaMask or email. Sees dark-themed dashboard.

### Day 2: Qoreid + 0G Pipeline

- `QoreidService` with HTTP client, VerifyNIN + VerifyBVN methods
- Test Qoreid calls with test mode credentials
- `VaultService`: AES-256-GCM encryption via libsodium
- `OgClient`, `OgKvStore`: store and retrieve encrypted data on 0G testnet
- `OgLogStore`: append audit events to 0G Log Layer
- `KycController`: full verify flow (input → Qoreid → encrypt → 0G → audit)
- Verifications migration + model
- `Verify.jsx`: form, loading states, error handling

**Deliverable:** User verifies NIN/BVN. Data encrypted and stored on 0G. Audit logged.

### Day 3: Share System

- `ShareService`: hash generation, retrieval with decryption
- share_links migration + model
- `ShareController`: create, list, deactivate
- `PublicVerifyController`: Inertia page + JSON API endpoint
- `Shares.jsx`: list with copy button, access count, deactivate toggle
- `Public/VerifyHash.jsx`: public page showing verified data + 0G badge
- Audit logging for share creation + access events

**Deliverable:** User generates share hash. Public URL shows verified data. Audit trail complete.

### Day 4: Polish + Remaining Types

- Add Passport, Driver's License, Voter's Card to `QoreidService`
- Dashboard stats row with counters
- `Audit.jsx`: timeline with color-coded events from 0G
- Error states: Qoreid failures, 0G timeouts, invalid hashes
- Responsive design pass
- Loading states, transitions, hover effects, toast system

**Deliverable:** Polished Web3 UI. All ID types working. Complete audit trail.

### Day 5: Demo Prep

- `DemoSeeder`: pre-verified user with NIN + BVN, active shares, audit history
- End-to-end test: register → verify → share → open hash in incognito → deactivate
- Record backup demo video
- Docker: `docker-compose` with app + mysql + redis
- README with screenshots, architecture diagram, setup steps
- 3-minute pitch deck
- Practice demo 3 times

**Deliverable:** Demo-ready. Backup video. Pitch rehearsed.

---

## 19. Demo Script (3 Minutes)

**0:00–0:20 | Problem:**
"Every fintech in Nigeria asks for your NIN. You type it into 10 different apps. Each one stores a copy. One breach and your identity is everywhere."

**0:20–0:40 | Solution:**
"VaultID: verify your identity once, store it encrypted on 0G's decentralized network, and share a hash with anyone who needs to verify you."

**0:40–2:00 | Live Demo:**
1. Connect MetaMask wallet (show popup)
2. Dashboard with dark Web3 UI, verification cards
3. Click "Verify NIN," enter number, Qoreid succeeds
4. Card turns green — "Verified" badge + "Stored on 0G"
5. Generate share link, copy hash
6. Open hash URL in incognito — verified data with 0G badge
7. Show audit trail: verification + share + access events
8. Deactivate link → refresh incognito → 404

**2:00–2:30 | 0G Integration:**
"KV Layer stores encrypted KYC data. Log Layer is the immutable audit trail. Fintechs just call one endpoint with the hash. No SDK needed."

**2:30–3:00 | Vision:**
"Next: PIN-protected links, time-limited access, client-side encryption, mobile app, pan-African expansion."

---

## 20. Environment Configuration

```env
APP_NAME=VaultID
APP_ENV=local
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=vaultid
DB_USERNAME=root
DB_PASSWORD=password

QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1

# Qoreid
QOREID_BASE_URL=https://api.qoreid.com
QOREID_SECRET_KEY=test_sk_...
QOREID_CLIENT_ID=your_client_id

# 0G Storage
OG_INDEXER_RPC=https://indexer-storage-testnet.0g.ai
OG_BLOCKCHAIN_RPC=https://evmrpc-testnet.0g.ai
OG_PRIVATE_KEY=your_0g_wallet_private_key
OG_FLOW_CONTRACT=0x...
OG_ENCRYPTION_KEY=base64_encoded_32_byte_aes_key
```

---

## 21. Docker Compose

```yaml
version: '3.8'
services:
    app:
        build: .
        ports:
            - "8000:8000"
        depends_on:
            - mysql
            - redis
        env_file: .env
        volumes:
            - .:/var/www/html

    mysql:
        image: mysql:8
        environment:
            MYSQL_ROOT_PASSWORD: password
            MYSQL_DATABASE: vaultid
        ports:
            - "3306:3306"
        volumes:
            - mysql_data:/var/lib/mysql

    redis:
        image: redis:7-alpine
        ports:
            - "6379:6379"

volumes:
    mysql_data:
```

---

## 22. Quick Start

```bash
git clone https://github.com/you/vaultid.git && cd vaultid
cp .env.example .env
composer install && npm install
php artisan key:generate

# Start services
docker-compose up -d mysql redis
php artisan migrate
php artisan db:seed --class=DemoSeeder

# Run (two terminals)
php artisan serve        # Terminal 1
npm run dev              # Terminal 2

# Open http://localhost:8000
```

---

## 23. Post-Hackathon Roadmap

| Feature | Description |
|---------|-------------|
| **PIN-protected links** | Optional PIN on share hash — fintech must provide PIN to access |
| **Time-limited links** | Auto-expire after X hours/days |
| **Client-side encryption** | Web Crypto API — user's wallet derives encryption key, server never sees plaintext |
| **Selective sharing** | Share only name + photo, not full response |
| **Mobile app** | React Native with WalletConnect |
| **Pan-African expansion** | Ghana (Ghana Card), Kenya (Huduma), South Africa (SA ID) |
| **Fintech dashboard** | Optional: registered fintechs with analytics on verification lookups |
| **Compliance engine** | Auto-generate NDPC/GDPR compliance reports from 0G audit trail |
