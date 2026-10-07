<?php

namespace App\Http\Controllers;

use App\Services\ExpressService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(protected ExpressService $express) {}

    public function index()
    {
        $user = auth()->user();
        $role = $this->express->getRole($user);

        return match ($role) {
            'super_admin' => Inertia::render('SuperAdmin/Dashboard'),
            'admin'       => Inertia::render('Admin/Dashboard'),
            'sales'       => Inertia::render('Sales/Dashboard'),
            default       => Inertia::render('Shared/Forbidden'),
        };
    }
}
