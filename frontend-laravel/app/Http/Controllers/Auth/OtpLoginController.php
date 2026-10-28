<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\ExpressService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class OtpLoginController extends Controller
{
    public function __construct(protected ExpressService $express) {}

    public function showVerify(Request $request)
    {
        $email = $request->session()->get('otp_email');

        if (!$email) {
            return redirect()->route('login');
        }

        $devOtp = session('dev_otp_code') ?: $this->express->getActiveOtp((string) $email);

        return Inertia::render('Auth/VerifyOtp', [
            'email'        => (string) $email,
            'status'       => session('status'),
            'dev_otp_code' => $devOtp,
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $email = $request->session()->get('otp_email');

        if (!$email) {
            return redirect()->route('login');
        }

        $expressUser = $this->express->verifyOtp((string) $email, $data['code']);

        if (!$expressUser) {
            throw ValidationException::withMessages([
                'code' => 'Kode OTP salah atau kadaluarsa',
            ]);
        }

        // Mapping role_slug dari Express ke name di tabel `roles`
        $roleName = match ($expressUser['role_slug'] ?? null) {
            'super_admin' => 'Super Admin',
            'admin'       => 'Admin',
            'cs'          => 'CS',
            default       => 'CS',
        };

        $role = Role::where('name', $roleName)->first();

        if (!$role) {
            throw ValidationException::withMessages([
                'code' => 'Role tidak ditemukan di sistem',
            ]);
        }

        // Ambil user lama kalau ada, atau bikin instance baru
        $user = User::firstOrNew(['email' => $expressUser['email']]);

        $user->fill([
            'role_id'       => $role->id,
            'name'          => $expressUser['name'],
            'status'        => 'active',
            'last_login_at' => now(),
        ]);

        // Cuma set password placeholder kalau user BARU
        // User lama: password-nya TIDAK ditimpa random
        if (!$user->exists) {
            $user->password_hash = bcrypt(Str::random(32));
        }

        $user->save();

        Auth::login($user);

        $request->session()->forget('otp_email');
        $request->session()->forget('dev_otp_code');
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    public function resendOtp(Request $request)
    {
        $email = $request->session()->get('otp_email');

        if (!$email) {
            return redirect()->route('login');
        }

        $result = $this->express->resendOtp((string) $email);

        if (!$result['success']) {
            return back()->withErrors(['code' => $result['message'] ?? 'Gagal kirim ulang OTP']);
        }

        if (!empty($result['otp_code'])) {
            $request->session()->put('dev_otp_code', $result['otp_code']);
        }

        return back()->with('status', 'Kode OTP baru telah dikirim.');
    }
}