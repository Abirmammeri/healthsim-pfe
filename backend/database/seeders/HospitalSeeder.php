<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Hospital;

class HospitalSeeder extends Seeder
{
    public function run(): void
    {
        $hospitals = [
            [
                'name' => 'CHU Benbadis Constantine',
                'address' => 'Rue Docteur Benbadis, Constantine',
                'latitude' => 36.3650,
                'longitude' => 6.6147,
                'total_beds' => 400,
                'available_beds' => 120,
                'total_doctors' => 150,
                'total_nurses' => 280,
                'active_patients' => 285,
                'status' => 'charge_elevee'
            ],
            [
                'name' => 'Polyclinique El Khroub',
                'address' => 'El Khroub, Constantine',
                'latitude' => 36.2667,
                'longitude' => 6.7000,
                'total_beds' => 120,
                'available_beds' => 55,
                'total_doctors' => 40,
                'total_nurses' => 80,
                'active_patients' => 65,
                'status' => 'normal'
            ],
            [
                'name' => 'Polyclinique Boumerzoug',
                'address' => 'Boumerzoug, Constantine',
                'latitude' => 36.3500,
                'longitude' => 6.6800,
                'total_beds' => 150,
                'available_beds' => 28,
                'total_doctors' => 45,
                'total_nurses' => 90,
                'active_patients' => 122,
                'status' => 'critique'
            ],
            [
                'name' => 'Polyclinique Pierre et Marie Curie',
                'address' => 'Rue Pierre et Marie Curie, Constantine',
                'latitude' => 36.3700,
                'longitude' => 6.6100,
                'total_beds' => 180,
                'available_beds' => 67,
                'total_doctors' => 55,
                'total_nurses' => 110,
                'active_patients' => 110,
                'status' => 'charge_elevee'
            ],
        ];

        foreach ($hospitals as $hospital) {
            Hospital::create($hospital);
        }
    }
}
