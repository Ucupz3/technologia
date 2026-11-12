<?php

namespace App\Http\Middleware;

use App\Services\ExpressService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function __construct(protected ExpressService $express) {}

    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        $userRole = $this->express->getRole($user);

        if (!$userRole) {
            abort(403, 'Akun Anda tidak terdaftar di sistem ERP. Hubungi admin.');
        }

        $allowedRoles = array_map('trim', explode(',', $role));

        if (!in_array($userRole, $allowedRoles, true) && $userRole !== 'super_admin') {
            abort(403, 'Akses ditolak. Role Anda: ' . $userRole);
        }

        return $next($request);
    }
}