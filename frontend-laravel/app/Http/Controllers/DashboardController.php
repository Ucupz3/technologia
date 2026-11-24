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
        // Konversi role ke lowercase agar aman dari perbedaan kapitalisasi database ('CS' -> 'cs')
        $role = strtolower($this->express->getRole($user) ?? '');

        return match ($role) {
            'super_admin' => Inertia::render('SuperAdmin/Dashboard'),
            'admin'       => Inertia::render('Admin/Dashboard'),
            'cs'          => Inertia::render('CS/Dashboard'),
            'developer'   => Inertia::render('Developer/Index'), 
            default       => Inertia::render('Shared/Forbidden'),
        };
    }
}