<?php

use App\Http\Controllers\Api\PublicVerifyController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/verify/{hash}', [PublicVerifyController::class, 'retrieve'])->name('api.verify');
    Route::get('/records/{hash}', [PublicVerifyController::class, 'records'])->name('api.records');
    Route::get('/integrity/{merkleRoot}', [PublicVerifyController::class, 'verifyIntegrity'])->name('api.integrity');
});
