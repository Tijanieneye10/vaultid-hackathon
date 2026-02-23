<?php

use App\Http\Controllers\Api\PublicVerifyController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\Auth\EmailAuthController;
use App\Http\Controllers\Auth\WalletAuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KycController;
use App\Http\Controllers\ShareController;
use Illuminate\Support\Facades\Route;

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
