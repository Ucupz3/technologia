<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpressService
{
    protected string $baseUrl;
    protected string $token;

    public function __construct()
    {
        $this->baseUrl = rtrim(env('EXPRESS_API_URL', 'http://localhost:4000'), '/');
        $this->token = env('EXPRESS_INTERNAL_TOKEN', '');
    }

    protected function http()
    {
        return Http::withHeaders([
            'X-Internal-Token' => $this->token,
            'Accept'           => 'application/json',
        ])->timeout(10);
    }

    public function requestLogin(string $email, string $password): array
    {
        try {
            $response = $this->http()->post("{$this->baseUrl}/api/v1/auth/login", [
                'email'    => $email,
                'password' => $password,
            ]);

            if (!$response->successful()) {
                return [
                    'success' => false,
                    'message' => $response->json('message') ?? 'Email atau password salah',
                ];
            }

            return [
                'success' => true,
                'message' => $response->json('message'),
            ];
        } catch (\Throwable $e) {
            Log::error('Express requestLogin exception', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'message' => 'Tidak bisa menghubungi server',
            ];
        }
    }

    public function verifyOtp(string $email, string $code): ?array
    {
        try {
            $response = $this->http()->post("{$this->baseUrl}/api/v1/auth/verify-otp", [
                'email' => $email,
                'code'  => $code,
            ]);

            if (!$response->successful()) {
                return null;
            }

            return $response->json('data') ?: null;
        } catch (\Throwable $e) {
            Log::error('Express verifyOtp exception', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function resendOtp(string $email): bool
    {
        try {
            $response = $this->http()->post("{$this->baseUrl}/api/v1/auth/resend-otp", [
                'email' => $email,
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            return false;
        }
    }

    public function findUserByEmail(string $email): ?array
    {
        try {
            $response = $this->http()->get("{$this->baseUrl}/api/v1/users/by-email/{$email}");

            if (!$response->successful()) {
                return null;
            }

            return $response->json('data') ?: null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Ambil role dari relasi lokal `users.role_id` → `roles.name`.
     * Tidak query ke Express, jadi instant — tidak ada delay saat role diubah.
     */
    public function getRole(User $user): ?string
    {
        $roleName = $user->role?->name;

        return match ($roleName) {
            'Super Admin' => 'super_admin',
            'Admin'       => 'admin',
            'Sales'       => 'sales',
            default       => null,
        };
    }

    public function forgetRole(User $user): void
    {
        cache()->forget("express_role:{$user->id}");
    }
}