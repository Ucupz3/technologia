<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'orders';

    protected $fillable = [
        'order_number',
        'customer_id',
        'sales_id',
        'service_id',
        'team_id',
        'service_name_snapshot',
        'service_price_snapshot',
        'quantity',
        'status',
        'payment_status',
        'subtotal',
        'discount',
        'tax',
        'grand_total',
        'start_date_project',
        'end_date_project',
        'notes',
    ];

    protected $casts = [
        'service_price_snapshot' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'start_date_project' => 'datetime',
        'end_date_project' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function sales()
    {
        return $this->belongsTo(User::class, 'sales_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}