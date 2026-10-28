<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $table = 'users';

    // ✅ WAJIB: Memberitahu Laravel nama kolom password adalah password_hash
    protected $authPasswordName = 'password_hash';

    protected $fillable = [
        'role_id',
        'name',
        'email',
        'password_hash',
        'phone',
        'status',
        'last_login_at',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'last_login_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function jobs()
    {
        return $this->belongsToMany(Job::class, 'user_jobs', 'user_id', 'job_id')
                    ->withPivot('is_primary')
                    ->withTimestamps();
    }
}