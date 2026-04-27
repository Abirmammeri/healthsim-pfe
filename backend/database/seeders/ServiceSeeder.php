<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;
use App\Models\Equipment;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
       $services = [
    // CHU Benbadis (id: 1)
    ['hospital_id' => 1, 'name' => 'Urgences', 'head' => 'Dr. Meziane', 'doctors' => 12, 'nurses' => 24, 'beds' => 40, 'patients' => 35, 'available_beds' => 5],
    ['hospital_id' => 1, 'name' => 'Chirurgie', 'head' => 'Dr. Benali', 'doctors' => 8, 'nurses' => 16, 'beds' => 30, 'patients' => 25, 'available_beds' => 5],
    ['hospital_id' => 1, 'name' => 'Radiologie', 'head' => 'Dr. Hamidi', 'doctors' => 5, 'nurses' => 10, 'beds' => 10, 'patients' => 8, 'available_beds' => 2],
    ['hospital_id' => 1, 'name' => 'Réanimation', 'head' => 'Dr. Cherif', 'doctors' => 10, 'nurses' => 20, 'beds' => 20, 'patients' => 18, 'available_beds' => 2],

    // Polyclinique El Khroub (id: 2)
    ['hospital_id' => 2, 'name' => 'Urgences', 'head' => 'Dr. Saidi', 'doctors' => 5, 'nurses' => 10, 'beds' => 15, 'patients' => 10, 'available_beds' => 5],
    ['hospital_id' => 2, 'name' => 'Médecine générale', 'head' => 'Dr. Boudia', 'doctors' => 4, 'nurses' => 8, 'beds' => 20, 'patients' => 12, 'available_beds' => 8],

    // Polyclinique Boumerzoug (id: 3)
    ['hospital_id' => 3, 'name' => 'Urgences', 'head' => 'Dr. Ferhat', 'doctors' => 6, 'nurses' => 12, 'beds' => 20, 'patients' => 18, 'available_beds' => 2],
    ['hospital_id' => 3, 'name' => 'Chirurgie', 'head' => 'Dr. Boulahia', 'doctors' => 5, 'nurses' => 10, 'beds' => 25, 'patients' => 22, 'available_beds' => 3],
    ['hospital_id' => 3, 'name' => 'Pédiatrie', 'head' => 'Dr. Mansouri', 'doctors' => 4, 'nurses' => 8, 'beds' => 15, 'patients' => 12, 'available_beds' => 3],

    // Polyclinique Pierre et Marie Curie (id: 4)
    ['hospital_id' => 4, 'name' => 'Urgences', 'head' => 'Dr. Khaldi', 'doctors' => 7, 'nurses' => 14, 'beds' => 25, 'patients' => 20, 'available_beds' => 5],
    ['hospital_id' => 4, 'name' => 'Cardiologie', 'head' => 'Dr. Amrani', 'doctors' => 6, 'nurses' => 12, 'beds' => 20, 'patients' => 15, 'available_beds' => 5],
    ['hospital_id' => 4, 'name' => 'Radiologie', 'head' => 'Dr. Ziani', 'doctors' => 4, 'nurses' => 8, 'beds' => 10, 'patients' => 8, 'available_beds' => 2],
];
        foreach ($services as $service) {
            $s = Service::create($service);

            // Ajouter équipements par défaut
            Equipment::create([
                'service_id' => $s->id,
                'name' => 'Moniteur cardiaque',
                'type' => 'moniteur',
                'quantity' => 3,
                'status' => 'operational'
            ]);

            Equipment::create([
                'service_id' => $s->id,
                'name' => 'Défibrillateur',
                'type' => 'defibrillateur',
                'quantity' => 2,
                'status' => 'operational'
            ]);
        }
    }
}
