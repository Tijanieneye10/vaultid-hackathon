<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verifications');
    }
};
