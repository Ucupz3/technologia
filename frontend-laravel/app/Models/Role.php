<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $table = 'roles';

    protected $fillable = [
        'name',
        'description',
        'is_default',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }
}