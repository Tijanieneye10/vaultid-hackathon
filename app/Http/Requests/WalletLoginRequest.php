<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WalletLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'address' => ['required', 'string', 'size:42'],
            'signature' => ['required', 'string'],
        ];
    }
}
