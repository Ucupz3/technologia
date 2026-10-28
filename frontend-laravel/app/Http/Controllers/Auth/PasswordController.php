<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        // 1. Validasi input (HANYA password baru, current_password DIHAPUS)
        $validated = $request->validate([
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        // 2. Langsung timpa password lama dengan yang baru
        // Karena user sudah login (auth), ini aman.
        $request->user()->update([
            'password_hash' => Hash::make($validated['password']),
        ]);

        return back();
    }
}