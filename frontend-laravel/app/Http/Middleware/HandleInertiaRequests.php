<?php

namespace App\Http\Middleware;

use App\Services\ExpressService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $user = $request->user();
        $expressRole = null;

        if ($user) {
            $user->loadMissing('role'); // ← eager load relasi role
            $expressRole = app(ExpressService::class)->getRole($user);
        }

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id'      => $user->id,
                    'name'    => $user->name,
                    'email'   => $user->email,
                    'role_id' => $user->role_id,
                ] : null,
                'role' => $expressRole,
            ],
            'flash' => [
                'status'  => fn () => $request->session()->get('status'),
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}