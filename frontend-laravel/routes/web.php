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
    // Users
    Route::get('/users', fn() => Inertia::render('SuperAdmin/Users/Index'))->name('users.index');
    Route::get('/users/{id}', fn($id) => Inertia::render('SuperAdmin/Users/Show', ['userId' => (int) $id]))->name('users.show');

    // Roles
    Route::get('/roles', fn() => Inertia::render('SuperAdmin/Roles/Index'))->name('roles.index');
    Route::get('/roles/{id}', fn($id) => Inertia::render('SuperAdmin/Roles/Show', ['roleId' => (int) $id]))->name('roles.show'); 

    Route::get('/audit-logs', fn() => Inertia::render('SuperAdmin/AuditLogs/Index'))->name('audit-logs.index');

    Route::get('/schedules', fn() => Inertia::render('SuperAdmin/Schedules/Index'))->name('schedules.index');

    // Customers
    Route::get('/customers', fn() => Inertia::render('SuperAdmin/Customers/Index'))->name('customers.index');
    Route::get('/customers/{id}', fn($id) => Inertia::render('SuperAdmin/Customers/Show', ['customerId' => (int) $id]))->name('customers.show');

    Route::get('/orders', fn() => Inertia::render('SuperAdmin/Orders/Index'))->name('orders.index');
    Route::get('/orders/create', fn() => Inertia::render('SuperAdmin/Orders/Create'))->name('orders.create');
    Route::get('/orders/{id}', fn($id) => Inertia::render('SuperAdmin/Orders/Show', ['orderId' => (int) $id]))->name('orders.show'); 

    Route::get('/invoices', fn() => Inertia::render('SuperAdmin/Invoices/Index'))->name('invoices.index');
    Route::get('/invoices/{id}', fn($id) => Inertia::render('SuperAdmin/Invoices/Show', ['invoiceId' => (int) $id]))->name('invoices.show');

    // MASTER DATA
    Route::get('/master-data', fn() => Inertia::render('SuperAdmin/MasterData/Index'))->name('master-data.index');

    Route::get('/master-data/categories', fn() => redirect('/super-admin/master-data?tab=categories'))->name('master-data.categories');
    Route::get('/master-data/categories/{id}', fn($id) => Inertia::render('SuperAdmin/MasterData/Categories/Show', ['categoryId' => (int) $id]))->name('master-data.categories.show');
    
    Route::get('/master-data/services', fn() => redirect('/super-admin/master-data?tab=services'))->name('master-data.services');
    Route::get('/master-data/services/{id}', fn($id) => Inertia::render('SuperAdmin/MasterData/Services/Show', ['serviceId' => (int) $id]))->name('master-data.services.show');
    
    Route::get('/master-data/teams', fn() => redirect('/super-admin/master-data?tab=teams'))->name('master-data.teams');
    Route::get('/master-data/teams/{id}', fn($id) => Inertia::render('SuperAdmin/MasterData/Teams/Show', ['teamId' => (int) $id]))->name('master-data.teams.show');

});

// ========================================
// ADMIN
// ========================================
Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/services', fn() => Inertia::render('Admin/Services/Index'))->name('services.index');
    Route::get('/services/{id}', fn($id) => Inertia::render('Admin/Services/Show', ['serviceId' => (int) $id]))->name('services.show');

    // Customers
    Route::get('/customers', fn() => Inertia::render('Admin/Customers/Index'))->name('customers.index');
    Route::get('/customers/{id}', fn($id) => Inertia::render('Admin/Customers/Show', ['customerId' => (int) $id]))->name('customers.show');

    Route::get('/orders', fn() => Inertia::render('Admin/Orders/Index'))->name('orders.index');
    Route::get('/orders/create', fn() => Inertia::render('Admin/Orders/Create'))->name('orders.create');
    Route::get('/schedules', fn() => Inertia::render('Admin/Schedules/Index'))->name('schedules.index');

    Route::get('/invoices', fn() => Inertia::render('Admin/Invoices/Index'))->name('invoices.index');
    Route::get('/invoices/{id}', fn($id) => Inertia::render('Admin/Invoices/Show', ['invoiceId' => (int) $id]))->name('invoices.show');
});

// ========================================
// SALES
// ========================================
Route::middleware(['auth', 'role:sales'])->prefix('sales')->name('sales.')->group(function () {
    // Customers
    Route::get('/customers', fn() => Inertia::render('Sales/Customers/Index'))->name('customers.index');
    Route::get('/customers/{id}', fn($id) => Inertia::render('Sales/Customers/Show', ['customerId' => (int) $id]))->name('customers.show');

    Route::get('/orders', fn() => Inertia::render('Sales/Orders/Index'))->name('orders.index');
    Route::get('/orders/create', fn() => Inertia::render('Sales/Orders/Create'))->name('orders.create');
    Route::get('/invoices', fn() => Inertia::render('Sales/Invoices/Index'))->name('invoices.index');
    Route::get('/invoices/{id}', fn($id) => Inertia::render('Sales/Invoices/Show', ['invoiceId' => (int) $id]))->name('invoices.show');
});

require __DIR__.'/auth.php';