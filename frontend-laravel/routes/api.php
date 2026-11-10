<?php

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Proxy ke Express.js
|--------------------------------------------------------------------------
| Semua request /api/v1/* diteruskan ke Express dengan header internal.
|
| Perbaikan:
| - Query string ikut diteruskan (mis. ?tab=categories)
| - Header Authorization (Bearer token) ikut diteruskan
| - Content-Type & Accept ikut diteruskan
| - Body JSON & form-data didukung
| - Response headers penting (Content-Type) ikut dikembalikan
*/

Route::any('{path}', function ($path) {
    $express = rtrim(env('EXPRESS_API_URL', 'http://localhost:4000'), '/');
    $token   = env('EXPRESS_INTERNAL_TOKEN', '');

    // Bangun URL + query string asli
    $queryString = request()->getQueryString();
    $url = $express . '/api/' . $path . ($queryString ? '?' . $queryString : '');

    // Kumpulkan header yang perlu diteruskan
    $headers = [
        'X-Internal-Token' => $token,
        'Accept'           => 'application/json',
    ];

    // Teruskan Authorization dari client (kalau ada)
    if ($auth = request()->header('Authorization')) {
        $headers['Authorization'] = $auth;
    }

    // Tentukan payload
    $method  = request()->method();
    $payload = [];

    if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
        $contentType = request()->header('Content-Type', '');

        if (str_contains($contentType, 'multipart/form-data')) {
            // Kirim sebagai multipart (file upload)
            $payload = ['multipart' => collect(request()->all())->map(function ($value, $key) {
                if (request()->hasFile($key)) {
                    $file = request()->file($key);
                    return [
                        'name'     => $key,
                        'contents' => fopen($file->getRealPath(), 'r'),
                        'filename' => $file->getClientOriginalName(),
                    ];
                }
                return ['name' => $key, 'contents' => is_scalar($value) ? (string) $value : json_encode($value)];
            })->values()->all()];
        } else {
            // Default: JSON
            $headers['Content-Type'] = 'application/json';
            $payload = ['json' => request()->all()];
        }
    }

    try {
        $response = Http::withHeaders($headers)
            ->timeout(30)
            ->send($method, $url, $payload);

        // Kembalikan response + Content-Type asli
        return response(
            $response->body(),
            $response->status()
        )->header('Content-Type', $response->header('Content-Type') ?: 'application/json');

    } catch (\Illuminate\Http\Client\ConnectionException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Express API tidak dapat dihubungi: ' . $e->getMessage(),
        ], 502);
    }
})->where('path', '.*');