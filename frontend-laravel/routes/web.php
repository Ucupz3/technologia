<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Shared/Welcome');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// ========================================
// SUPER ADMIN
// ========================================
Route::middleware(['auth', 'role:super_admin'])->prefix('super-admin')->name('super-admin.')->group(function () {
    Route::get('/users', fn() => Inertia::render('SuperAdmin/Users/Index'))->name('users.index');
    Route::get('/roles', fn() => Inertia::render('SuperAdmin/Roles/Index'))->name('roles.index');
    Route::get('/audit-logs', fn() => Inertia::render('SuperAdmin/AuditLogs/Index'))->name('audit-logs.index');
    Route::get('/customers', fn() => Inertia::render('SuperAdmin/Customers/Index'))->name('customers.index');
    Route::get('/orders', fn() => Inertia::render('SuperAdmin/Orders/Index'))->name('orders.index');
    Route::get('/payments', fn() => Inertia::render('SuperAdmin/Payments/Index'))->name('payments.index');

    // Master Data
    Route::get('/master-data/categories', fn() => Inertia::render('SuperAdmin/MasterData/Categories/Index'))->name('master-data.categories');
    Route::get('/master-data/services', fn() => Inertia::render('SuperAdmin/MasterData/Services/Index'))->name('master-data.services');
    Route::get('/master-data/team-members', fn() => Inertia::render('SuperAdmin/MasterData/TeamMembers/Index'))->name('master-data.team-members');
});

// ========================================
// ADMIN
// ========================================
Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/services', fn() => Inertia::render('Admin/Services/Index'))->name('services.index');
    Route::get('/customers', fn() => Inertia::render('Admin/Customers/Index'))->name('customers.index');
    Route::get('/orders', fn() => Inertia::render('Admin/Orders/Index'))->name('orders.index');
    Route::get('/schedules', fn() => Inertia::render('Admin/Schedules/Index'))->name('schedules.index');
    Route::get('/payments', fn() => Inertia::render('Admin/Payments/Index'))->name('payments.index');
});

// ========================================
// SALES
// ========================================
Route::middleware(['auth', 'role:sales'])->prefix('sales')->name('sales.')->group(function () {
    Route::get('/customers', fn() => Inertia::render('Sales/Customers/Index'))->name('customers.index');
    Route::get('/orders', fn() => Inertia::render('Sales/Orders/Index'))->name('orders.index');
    Route::get('/invoices', fn() => Inertia::render('Sales/Invoices/Index'))->name('invoices.index');
});

require __DIR__.'/auth.php';