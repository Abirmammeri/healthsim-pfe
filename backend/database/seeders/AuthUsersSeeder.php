<?php
// database/seeders/AuthUsersSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthUsersSeeder extends Seeder
{
    public function run(): void
    {
        // Récupérer l'hôpital et les services
        $hospital = DB::table('hospitals')->where('code', 'CHU-CST-001')->first();
        if (!$hospital) { $this->command->error('Hôpital non trouvé. Lancez d\'abord DatabaseSeeder.'); return; }

        $urgences  = DB::table('services')->where('code', 'URG-001')->first();
        $chirurgie = DB::table('services')->where('code', 'CHI-001')->first();
        $reanimation = DB::table('services')->where('code', 'REA-001')->first();
        $medecine  = DB::table('services')->where('code', 'MED-001')->first();

        DB::table('users')->truncate();

        $users = [
            // ── DIRECTEUR ──
            [
                'name'        => 'Dr. Karim Benali',
                'nom'         => 'Benali',
                'prenom'      => 'Karim',
                'email'       => 'directeur@chu-constantine.dz',
                'password'    => Hash::make('directeur123'),
                'role'        => 'directeur',
                'hospital_id' => $hospital->id,
                'service_id'  => null,
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            // ── CHEFS DE SERVICE ──
            [
                'name'        => 'Dr. Meziane Urgences',
                'nom'         => 'Meziane',
                'prenom'      => 'Ahmed',
                'email'       => 'urgences@chu-constantine.dz',
                'password'    => Hash::make('urgences123'),
                'role'        => 'chef_service',
                'hospital_id' => $hospital->id,
                'service_id'  => $urgences?->id,
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            [
                'name'        => 'Dr. Boudjelal Chirurgie',
                'nom'         => 'Boudjelal',
                'prenom'      => 'Sofiane',
                'email'       => 'chirurgie@chu-constantine.dz',
                'password'    => Hash::make('chirurgie123'),
                'role'        => 'chef_service',
                'hospital_id' => $hospital->id,
                'service_id'  => $chirurgie?->id,
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            [
                'name'        => 'Dr. Hamidouche Réanimation',
                'nom'         => 'Hamidouche',
                'prenom'      => 'Riad',
                'email'       => 'reanimation@chu-constantine.dz',
                'password'    => Hash::make('reanimation123'),
                'role'        => 'chef_service',
                'hospital_id' => $hospital->id,
                'service_id'  => $reanimation?->id,
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            [
                'name'        => 'Dr. Khaldi Médecine Interne',
                'nom'         => 'Khaldi',
                'prenom'      => 'Samira',
                'email'       => 'medecine@chu-constantine.dz',
                'password'    => Hash::make('medecine123'),
                'role'        => 'chef_service',
                'hospital_id' => $hospital->id,
                'service_id'  => $medecine?->id,
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
        ];

        foreach ($users as $user) {
            DB::table('users')->insert($user);
        }

        $this->command->info('✅ Utilisateurs créés :');
        $this->command->info('   👔 directeur@chu-constantine.dz / directeur123');
        $this->command->info('   🩺 urgences@chu-constantine.dz / urgences123');
        $this->command->info('   🩺 chirurgie@chu-constantine.dz / chirurgie123');
        $this->command->info('   🩺 reanimation@chu-constantine.dz / reanimation123');
        $this->command->info('   🩺 medecine@chu-constantine.dz / medecine123');
    }
}