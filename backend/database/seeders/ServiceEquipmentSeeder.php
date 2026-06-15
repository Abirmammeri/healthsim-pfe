<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServiceEquipmentSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('service_equipments')->truncate();

        $services = DB::table('services')->get()->keyBy('name');

        $data = [
            'Médecine Interne' => [
                ['nom'=>'Échographie',    'quantite'=>3,'patients_par_jour'=>5,'duree_utilisation_min'=>25,'duree_utilisation_max'=>35],
                ['nom'=>'Radio X',        'quantite'=>1,'patients_par_jour'=>2,'duree_utilisation_min'=>10,'duree_utilisation_max'=>12],
                ['nom'=>'Capillaroscope', 'quantite'=>1,'patients_par_jour'=>1,'duree_utilisation_min'=>35,'duree_utilisation_max'=>45],
                ['nom'=>'Endoscope',      'quantite'=>1,'patients_par_jour'=>1,'duree_utilisation_min'=>20,'duree_utilisation_max'=>30],
                ['nom'=>'ECG',            'quantite'=>1,'patients_par_jour'=>2,'duree_utilisation_min'=>5, 'duree_utilisation_max'=>10],
            ],
            'Urgences' => [
                ['nom'=>'Défibrillateur',     'quantite'=>3,'patients_par_jour'=>4,'duree_utilisation_min'=>5, 'duree_utilisation_max'=>15],
                ['nom'=>'Moniteur cardiaque', 'quantite'=>5,'patients_par_jour'=>8,'duree_utilisation_min'=>15,'duree_utilisation_max'=>30],
                ['nom'=>'Radio X mobile',     'quantite'=>2,'patients_par_jour'=>6,'duree_utilisation_min'=>10,'duree_utilisation_max'=>15],
                ['nom'=>'ECG',                'quantite'=>2,'patients_par_jour'=>5,'duree_utilisation_min'=>5, 'duree_utilisation_max'=>10],
                ['nom'=>'Oxymètre',           'quantite'=>4,'patients_par_jour'=>10,'duree_utilisation_min'=>3,'duree_utilisation_max'=>5],
            ],
            'Chirurgie' => [
                ['nom'=>'Bistouri électrique','quantite'=>3,'patients_par_jour'=>4,'duree_utilisation_min'=>45,'duree_utilisation_max'=>120],
                ['nom'=>'Table opératoire',   'quantite'=>3,'patients_par_jour'=>4,'duree_utilisation_min'=>60,'duree_utilisation_max'=>180],
                ['nom'=>'Moniteur anesthésie','quantite'=>3,'patients_par_jour'=>4,'duree_utilisation_min'=>60,'duree_utilisation_max'=>180],
                ['nom'=>'Échographie',        'quantite'=>1,'patients_par_jour'=>2,'duree_utilisation_min'=>20,'duree_utilisation_max'=>30],
                ['nom'=>'Radio X mobile',     'quantite'=>1,'patients_par_jour'=>3,'duree_utilisation_min'=>10,'duree_utilisation_max'=>15],
            ],
            'Réanimation' => [
                ['nom'=>'Respirateur',               'quantite'=>8,'patients_par_jour'=>8,'duree_utilisation_min'=>240,'duree_utilisation_max'=>480],
                ['nom'=>'Moniteur multiparamétrique','quantite'=>8,'patients_par_jour'=>8,'duree_utilisation_min'=>240,'duree_utilisation_max'=>480],
                ['nom'=>'Pompe à perfusion',         'quantite'=>10,'patients_par_jour'=>8,'duree_utilisation_min'=>120,'duree_utilisation_max'=>360],
                ['nom'=>'Défibrillateur',            'quantite'=>2,'patients_par_jour'=>2,'duree_utilisation_min'=>5,  'duree_utilisation_max'=>15],
                ['nom'=>'ECG',                       'quantite'=>2,'patients_par_jour'=>4,'duree_utilisation_min'=>5,  'duree_utilisation_max'=>10],
            ],
        ];

        foreach ($data as $serviceName => $items) {
            $service = $services->first(function($s) use ($serviceName) {
                return stripos($s->name, explode(' ', $serviceName)[0]) !== false;
            });
            if (!$service) continue;

            foreach ($items as $item) {
                DB::table('service_equipments')->insert([
                    'service_id'            => $service->id,
                    'nom'                   => $item['nom'],
                    'quantite'              => $item['quantite'],
                    'patients_par_jour'     => $item['patients_par_jour'],
                    'duree_utilisation_min' => $item['duree_utilisation_min'],
                    'duree_utilisation_max' => $item['duree_utilisation_max'],
                    'statut'                => 'operational',
                    'created_at'            => now(),
                    'updated_at'            => now(),
                ]);
            }
            echo "✅ $serviceName OK\n";
        }
    }
}
