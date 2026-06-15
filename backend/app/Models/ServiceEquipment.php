<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceEquipment extends Model
{
    protected $table = 'service_equipments';

    protected $fillable = [
        'service_id', 'nom', 'quantite', 'patients_par_jour',
        'duree_utilisation_min', 'duree_utilisation_max', 'statut',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
