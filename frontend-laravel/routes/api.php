<?php

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Proxy ke Express.js
|--------------------------------------------------------------------------
| Semua request /api/v1/* diteruskan ke Express dengan header internal.
*/

Route::any('{path}', function ($path) {
    $express = env('EXPRESS_API_URL', 'http://localhost:4000');
    $token = env('EXPRESS_INTERNAL_TOKEN', '');

    $response = Http::withHeaders([
        'X-Internal-Token' => $token,
        'Accept' => 'application/json',
    ])->send(request()->method(), "$express/api/$path", [
        'json' => request()->all(),
    ]);

    return response()->json($response->json(), $response->status());
})->where('path', '.*');
