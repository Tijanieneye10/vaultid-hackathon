<?php

namespace App\Http\Requests;

use App\Enums\IdType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VerifyKycRequest extends FormRequest
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
        $rules = [
            'id_type' => ['required', Rule::enum(IdType::class)],
            'id_number' => ['required', 'string'],
        ];

        $type = IdType::tryFrom($this->id_type ?? '');

        if ($type) {
            $rules['id_number'] = array_merge($rules['id_number'], (array) $type->validationRule());
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
