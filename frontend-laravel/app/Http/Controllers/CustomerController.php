<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;

class CustomerController extends Controller
{

    public function index()
    {
        return Inertia::render('Customers/Index');
    }

    public function show($id)
    {
        return Inertia::render('Customers/Show', [
            'customerId' => (int) $id,
        ]);
    }
}