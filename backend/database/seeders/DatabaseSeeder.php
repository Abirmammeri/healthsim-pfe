<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        $tables = [
            'kpi_snapshots','simulations','budgets','staff',
            'equipment','alerts','services','hospitals',
        ];
        foreach ($tables as $t) {
            if (Schema::hasTable($t)) DB::table($t)->truncate();
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // ── HÔPITAL ─────────────────────────────────
        // Colonnes: id,name,code,type_hopital,wilaya,commune,address,
        // latitude,longitude,total_beds,available_beds,total_doctors,
        // total_nurses,active_patients,status,load_status,budget_annuel,
        // score_localisation,score_air_interieur,score_acoustique
        $hospitalId = DB::table('hospitals')->insertGetId([
            'name'                => 'CHU Ibn Badis — Constantine',
            'code'                => 'CHU-CST-001',
            'type_hopital'        => 'CHU',
            'wilaya'              => 'Constantine',
            'commune'             => 'Constantine',
            'address'             => 'Route de Ain Smara, Constantine 25000',
            'latitude'            => 36.3650,
            'longitude'           => 6.6147,
            'total_beds'          => 320,
            'available_beds'      => 53,
            'total_doctors'       => 48,
            'total_nurses'        => 124,
            'active_patients'     => 267,
            'status'              => 'charge_elevee',
            'load_status'         => 'high',
            'budget_annuel'       => 850000000,
            'score_localisation'  => 81,
            'score_air_interieur' => 76,
            'score_acoustique'    => 62,
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);

        // ── SERVICES ────────────────────────────────
        // Colonnes services connues — on utilise Schema::hasColumn pour les optionnelles
        $svcCols = Schema::getColumnListing('services');

        $servicesRaw = [
            [
                'base' => [
                    'name'        => 'Urgences',
                    'hospital_id' => $hospitalId,
                    'beds'        => 45,
                    'patients'    => 41,
                    'doctors'     => 12,
                    'nurses'      => 28,
                    'status'      => 'critical',
                ],
                'opt' => [
                    'code'=>'URG-001','type'=>'urgences','head'=>'Meziane',
                    'dms_heures'=>6,'simulation_hours'=>24,
                    'nb_patients_mois'=>1240,'nb_deces_mois'=>8,
                    'nb_infections_mois'=>14,'nb_transferts_mois'=>148,'nb_readmissions_mois'=>62,
                    'mortalite_base'=>0.65,'salaire_medecin'=>120000,'salaire_infirmier'=>75000,
                    'cout_medicament_unit'=>2800,'cout_maintenance_eq'=>45000,
                    'score_distribution_eq'=>68,'score_gestion_dechets'=>71,
                ],
                'kpis' => [
                    'SSI'=>['A2_dms'=>0.25,'A4_temps_attente'=>34.2,'A8_lits_vacants'=>8.9,'A9_taux_transfert'=>11.9],
                    'IIP'=>['C2_occupation'=>91.1,'C3_mortalite'=>0.65,'C4_infection'=>1.13],
                    'ESI'=>['B1_cout_soins'=>3472,'B4_cout_lit'=>578,'B5_cout_med_eq'=>3472000,'B7_cout_personnel'=>4116000],
                    'TI' =>['D5_distribution_eq'=>68,'D11_gestion_dechets'=>71,'D12_localisation'=>81,'D13_air_interieur'=>72,'D14_acoustique'=>55],
                    'DES'=>['lambda_rate'=>0.83,'mu_rate'=>0.167,'rho_doctors'=>0.81,'rho_beds'=>0.91],
                ],
                'snap' => ['A2'=>0.25,'A4'=>34.2,'A8'=>8.9,'A9'=>11.9,'C2'=>91.1,'C3'=>0.65,'C4'=>1.13,'B1'=>3472,'B4'=>578,'B5'=>3472000,'B7'=>4116000,'D5'=>68,'D11'=>71,'D12'=>81,'D13'=>72,'D14'=>55,'lambda'=>0.83,'mu'=>0.167,'rho_d'=>0.81,'rho_b'=>0.91],
            ],
            [
                'base' => [
                    'name'        => 'Chirurgie',
                    'hospital_id' => $hospitalId,
                    'beds'        => 80,
                    'patients'    => 68,
                    'doctors'     => 14,
                    'nurses'      => 32,
                    'status'      => 'medium',
                ],
                'opt' => [
                    'code'=>'CHI-001','type'=>'chirurgie','head'=>'Boudjelal',
                    'dms_heures'=>168,'simulation_hours'=>168,
                    'nb_patients_mois'=>320,'nb_deces_mois'=>6,
                    'nb_infections_mois'=>12,'nb_transferts_mois'=>22,'nb_readmissions_mois'=>18,
                    'mortalite_base'=>1.88,'salaire_medecin'=>135000,'salaire_infirmier'=>78000,
                    'cout_medicament_unit'=>3200,'cout_maintenance_eq'=>72000,
                    'score_distribution_eq'=>79,'score_gestion_dechets'=>74,
                ],
                'kpis' => [
                    'SSI'=>['A2_dms'=>7.0,'A4_temps_attente'=>18.4,'A8_lits_vacants'=>15.0,'A9_taux_transfert'=>6.9],
                    'IIP'=>['C2_occupation'=>85.0,'C3_mortalite'=>1.88,'C4_infection'=>3.75],
                    'ESI'=>['B1_cout_soins'=>6720,'B4_cout_lit'=>840,'B5_cout_med_eq'=>1024000,'B7_cout_personnel'=>5318400],
                    'TI' =>['D5_distribution_eq'=>79,'D11_gestion_dechets'=>74,'D12_localisation'=>81,'D13_air_interieur'=>80,'D14_acoustique'=>68],
                    'DES'=>['lambda_rate'=>0.19,'mu_rate'=>0.006,'rho_doctors'=>0.76,'rho_beds'=>0.85],
                ],
                'snap' => ['A2'=>7.0,'A4'=>18.4,'A8'=>15.0,'A9'=>6.9,'C2'=>85.0,'C3'=>1.88,'C4'=>3.75,'B1'=>6720,'B4'=>840,'B5'=>1024000,'B7'=>5318400,'D5'=>79,'D11'=>74,'D12'=>81,'D13'=>80,'D14'=>68,'lambda'=>0.19,'mu'=>0.006,'rho_d'=>0.76,'rho_b'=>0.85],
            ],
            [
                'base' => [
                    'name'        => 'Réanimation',
                    'hospital_id' => $hospitalId,
                    'beds'        => 24,
                    'patients'    => 22,
                    'doctors'     => 10,
                    'nurses'      => 30,
                    'status'      => 'critical',
                ],
                'opt' => [
                    'code'=>'REA-001','type'=>'reanimation','head'=>'Hamidouche',
                    'dms_heures'=>72,'simulation_hours'=>72,
                    'nb_patients_mois'=>88,'nb_deces_mois'=>9,
                    'nb_infections_mois'=>11,'nb_transferts_mois'=>8,'nb_readmissions_mois'=>4,
                    'mortalite_base'=>10.23,'salaire_medecin'=>145000,'salaire_infirmier'=>88000,
                    'cout_medicament_unit'=>8500,'cout_maintenance_eq'=>120000,
                    'score_distribution_eq'=>85,'score_gestion_dechets'=>82,
                ],
                'kpis' => [
                    'SSI'=>['A2_dms'=>3.0,'A4_temps_attente'=>8.1,'A8_lits_vacants'=>8.3,'A9_taux_transfert'=>9.1],
                    'IIP'=>['C2_occupation'=>91.7,'C3_mortalite'=>10.23,'C4_infection'=>12.5],
                    'ESI'=>['B1_cout_soins'=>24650,'B4_cout_lit'=>3081,'B5_cout_med_eq'=>748000,'B7_cout_personnel'=>4087200],
                    'TI' =>['D5_distribution_eq'=>85,'D11_gestion_dechets'=>82,'D12_localisation'=>81,'D13_air_interieur'=>88,'D14_acoustique'=>71],
                    'DES'=>['lambda_rate'=>0.12,'mu_rate'=>0.014,'rho_doctors'=>0.86,'rho_beds'=>0.92],
                ],
                'snap' => ['A2'=>3.0,'A4'=>8.1,'A8'=>8.3,'A9'=>9.1,'C2'=>91.7,'C3'=>10.23,'C4'=>12.5,'B1'=>24650,'B4'=>3081,'B5'=>748000,'B7'=>4087200,'D5'=>85,'D11'=>82,'D12'=>81,'D13'=>88,'D14'=>71,'lambda'=>0.12,'mu'=>0.014,'rho_d'=>0.86,'rho_b'=>0.92],
            ],
            [
                'base' => [
                    'name'        => 'Médecine Interne',
                    'hospital_id' => $hospitalId,
                    'beds'        => 120,
                    'patients'    => 96,
                    'doctors'     => 16,
                    'nurses'      => 38,
                    'status'      => 'normal',
                ],
                'opt' => [
                    'code'=>'MED-001','type'=>'medecine_interne','head'=>'Khaldi',
                    'dms_heures'=>96,'simulation_hours'=>96,
                    'nb_patients_mois'=>384,'nb_deces_mois'=>8,
                    'nb_infections_mois'=>11,'nb_transferts_mois'=>19,'nb_readmissions_mois'=>29,
                    'mortalite_base'=>2.08,'salaire_medecin'=>120000,'salaire_infirmier'=>75000,
                    'cout_medicament_unit'=>2200,'cout_maintenance_eq'=>38000,
                    'score_distribution_eq'=>72,'score_gestion_dechets'=>65,
                ],
                'kpis' => [
                    'SSI'=>['A2_dms'=>4.0,'A4_temps_attente'=>22.6,'A8_lits_vacants'=>20.0,'A9_taux_transfert'=>4.9],
                    'IIP'=>['C2_occupation'=>80.0,'C3_mortalite'=>2.08,'C4_infection'=>2.86],
                    'ESI'=>['B1_cout_soins'=>4221,'B4_cout_lit'=>703,'B5_cout_med_eq'=>844800,'B7_cout_personnel'=>5406720],
                    'TI' =>['D5_distribution_eq'=>72,'D11_gestion_dechets'=>65,'D12_localisation'=>81,'D13_air_interieur'=>74,'D14_acoustique'=>67],
                    'DES'=>['lambda_rate'=>0.27,'mu_rate'=>0.010,'rho_doctors'=>0.71,'rho_beds'=>0.80],
                ],
                'snap' => ['A2'=>4.0,'A4'=>22.6,'A8'=>20.0,'A9'=>4.9,'C2'=>80.0,'C3'=>2.08,'C4'=>2.86,'B1'=>4221,'B4'=>703,'B5'=>844800,'B7'=>5406720,'D5'=>72,'D11'=>65,'D12'=>81,'D13'=>74,'D14'=>67,'lambda'=>0.27,'mu'=>0.010,'rho_d'=>0.71,'rho_b'=>0.80],
            ],
        ];

        $serviceIds = [];
        foreach ($servicesRaw as $raw) {
            $row = array_merge($raw['base'], ['created_at'=>now(),'updated_at'=>now()]);
            foreach ($raw['opt'] as $col => $val) {
                if (in_array($col, $svcCols)) $row[$col] = $val;
            }
            if (in_array('kpis', $svcCols)) $row['kpis'] = json_encode($raw['kpis']);
            $serviceIds[] = DB::table('services')->insertGetId($row);
        }

        // ── ÉQUIPEMENTS ─────────────────────────────
        $equipList = [
            [$serviceIds[0],'Moniteur cardiaque','Surveillance',8,'operational'],
            [$serviceIds[0],'Défibrillateur','Urgence',3,'operational'],
            [$serviceIds[0],'Respirateur','Réanimation',6,'operational'],
            [$serviceIds[0],'Échographe portable','Imagerie',2,'maintenance'],
            [$serviceIds[0],'Pompe à perfusion','Traitement',15,'operational'],
            [$serviceIds[1],"Table d'opération",'Chirurgie',4,'operational'],
            [$serviceIds[1],'Bistouri électrique','Chirurgie',6,'operational'],
            [$serviceIds[1],'Colonne laparoscopie','Chirurgie',2,'operational'],
            [$serviceIds[1],"Scope d'anesthésie",'Anesthésie',4,'operational'],
            [$serviceIds[1],'Autoclave stérilisation','Stérilisation',2,'maintenance'],
            [$serviceIds[2],'Ventilateur haute perf.','Réanimation',12,'operational'],
            [$serviceIds[2],'Moniteur multi-paramètres','Surveillance',12,'operational'],
            [$serviceIds[2],'Pousse-seringue électrique','Traitement',24,'operational'],
            [$serviceIds[2],'Dialyse continue','Épuration',3,'operational'],
            [$serviceIds[2],'Défibrillateur réa','Urgence',2,'hors_service'],
            [$serviceIds[3],'Électrocardiographe','Diagnostic',4,'operational'],
            [$serviceIds[3],'Saturomètre','Surveillance',20,'operational'],
            [$serviceIds[3],'Glucomètre','Diagnostic',10,'operational'],
            [$serviceIds[3],'Tensiomètre électronique','Surveillance',15,'operational'],
            [$serviceIds[3],'Pompe à perfusion','Traitement',25,'maintenance'],
        ];
        $eqCols = Schema::getColumnListing('equipment');
        foreach ($equipList as [$svcId,$name,$type,$qty,$status]) {
            $row = ['service_id'=>$svcId,'name'=>$name,'quantity'=>$qty,'status'=>$status,'created_at'=>now(),'updated_at'=>now()];
            if (in_array('hospital_id',$eqCols)) $row['hospital_id'] = $hospitalId;
            if (in_array('type',$eqCols))        $row['type']        = $type;
            DB::table('equipment')->insert($row);
        }

        // ── ALERTES ─────────────────────────────────
        // Colonnes: id,hospital_id,title,message,severity,type,is_read
        // type: ('saturation','personnel','equipment','general')
        // severity: ('low','medium','high','critical')
        $alertList = [
            ['saturation','critical','Urgences — Saturation lits',    'Urgences saturées à 91.1% — 41/45 lits occupés, intervention requise'],
            ['saturation','critical','Réanimation — Saturation lits',  'Réanimation saturée à 91.7% — 22/24 lits occupés'],
            ['saturation','high',    "Urgences — Temps d'attente",     "Temps d'attente 34 min aux Urgences — Seuil critique dépassé"],
            ['general',   'medium',  'Chirurgie — Infections',         'Taux infection Chirurgie 3.75% > seuil OMS 3.5%'],
            ['general',   'medium',  'Méd. Interne — DASRI',           'Score DASRI Médecine Interne 65/100 — Non conforme OMS'],
        ];
        foreach ($alertList as [$type,$severity,$title,$message]) {
            DB::table('alerts')->insert([
                'hospital_id' => $hospitalId,
                'title'       => $title,
                'message'     => $message,
                'severity'    => $severity,
                'type'        => $type,
                'is_read'     => false,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        // ── STAFF ────────────────────────────────────
        // Colonnes: id,hospital_id,service_id,matricule,nom,prenom,
        // type,specialite,statut,salaire
        if (Schema::hasTable('staff')) {
            $staffList = [
                [$serviceIds[0],'BZD001','Bouzid',  'Amira',   'medecin_specialiste','Urgentiste',          120000],
                [$serviceIds[0],'DAL001','Dali',     'Yacine',  'medecin_specialiste','Urgentiste',          120000],
                [$serviceIds[0],'BEN001','Benali',   'Nadia',   'infirmier',          'Soins urgence',       75000],
                [$serviceIds[1],'AIT001','Ait Ali',  'Sofiane', 'medecin_specialiste','Chirurgien viscéral', 135000],
                [$serviceIds[1],'BOU001','Boukhalfa','Lina',    'medecin_specialiste','Chirurgien ortho',    135000],
                [$serviceIds[2],'FER001','Ferdi',    'Riad',    'medecin_specialiste','Réanimateur',         145000],
                [$serviceIds[3],'GUE001','Guerfi',   'Samira',  'medecin_specialiste','Interniste',          120000],
            ];
            foreach ($staffList as [$svcId,$mat,$nom,$prenom,$type,$spec,$salaire]) {
                DB::table('staff')->insert([
                    'service_id'  => $svcId,
                    'hospital_id' => $hospitalId,
                    'matricule'   => $mat,
                    'nom'         => $nom,
                    'prenom'      => $prenom,
                    'type'        => $type,
                    'specialite'  => $spec,
                    'statut'      => 'actif',
                    'salaire'     => $salaire,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        }

        // ── BUDGETS ──────────────────────────────────
        // Colonnes: id,hospital_id,annee,budget_total,budget_personnel,
        // budget_medicaments,budget_equipements,budget_maintenance,
        // budget_energie,budget_autre,statut
        if (Schema::hasTable('budgets')) {
            // Budget hôpital global
            DB::table('budgets')->insert([
                'hospital_id'         => $hospitalId,
                'annee'               => 2026,
                'budget_total'        => 850000000,
                'budget_personnel'    => 510000000,
                'budget_medicaments'  => 170000000,
                'budget_equipements'  => 85000000,
                'budget_maintenance'  => 42500000,
                'budget_energie'      => 25500000,
                'budget_autre'        => 17000000,
                'statut'              => 'approuve',
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);
        }

        // ── KPI SNAPSHOTS ─────────────────────────────
        // Colonnes: id,service_id,hospital_id,periode,type_periode,
        // A2_dms_jours,A4_temps_attente,A8_lits_vacants,A9_taux_transfert,
        // C2_occupation_lits,C3_mortalite,C4_infection,
        // B1_cout_moyen_soins,B4_cout_par_lit,B5_cout_med_eq,B7_cout_personnel,
        // D5_distribution_eq,D11_gestion_dechets,D12_localisation,D13_air_interieur,D14_acoustique,
        // lambda_rate,mu_rate,rho_doctors,rho_beds,
        // active_patients,nb_doctors,nb_nurses,nb_beds,statut_global
        if (Schema::hasTable('kpi_snapshots')) {
            $months = ['2025-12-01','2026-01-01','2026-02-01','2026-03-01','2026-04-01','2026-05-01'];
            $svcInfo = [
                ['patients'=>41,'doctors'=>12,'nurses'=>28,'beds'=>45],
                ['patients'=>68,'doctors'=>14,'nurses'=>32,'beds'=>80],
                ['patients'=>22,'doctors'=>10,'nurses'=>30,'beds'=>24],
                ['patients'=>96,'doctors'=>16,'nurses'=>38,'beds'=>120],
            ];
            foreach ($servicesRaw as $idx => $raw) {
                $s = $raw['snap'];
                $info = $svcInfo[$idx];
                foreach ($months as $mi => $month) {
                    $f = 1 + $mi * 0.02;
                    DB::table('kpi_snapshots')->insert([
                        'service_id'          => $serviceIds[$idx],
                        'hospital_id'         => $hospitalId,
                        'periode'             => $month,
                        'type_periode'        => 'mensuel',
                        'A2_dms_jours'        => round($s['A2'] * $f, 2),
                        'A4_temps_attente'    => round($s['A4'] * $f, 1),
                        'A8_lits_vacants'     => round($s['A8'] / $f, 1),
                        'A9_taux_transfert'   => round($s['A9'] * $f, 1),
                        'C2_occupation_lits'  => round(min(99, $s['C2'] * $f), 1),
                        'C3_mortalite'        => round($s['C3'] * $f, 2),
                        'C4_infection'        => round($s['C4'] * $f, 2),
                        'B1_cout_moyen_soins' => round($s['B1'] * $f),
                        'B4_cout_par_lit'     => round($s['B4'] * $f),
                        'B5_cout_med_eq'      => round($s['B5'] * $f),
                        'B7_cout_personnel'   => round($s['B7'] * $f),
                        'D5_distribution_eq'  => round(max(40, $s['D5'] / $f), 1),
                        'D11_gestion_dechets' => round($s['D11'], 1),
                        'D12_localisation'    => round($s['D12'], 1),
                        'D13_air_interieur'   => round($s['D13'], 1),
                        'D14_acoustique'      => round($s['D14'], 1),
                        'lambda_rate'         => $s['lambda'],
                        'mu_rate'             => $s['mu'],
                        'rho_doctors'         => $s['rho_d'],
                        'rho_beds'            => $s['rho_b'],
                        'active_patients'     => $info['patients'],
                        'nb_doctors'          => $info['doctors'],
                        'nb_nurses'           => $info['nurses'],
                        'nb_beds'             => $info['beds'],
                        'statut_global'       => $s['C2'] * $f >= 90 ? 'critique' : ($s['C2'] * $f >= 75 ? 'attention' : 'normal'),
                        'created_at'          => now(),
                        'updated_at'          => now(),
                    ]);
                }
            }
        }

        // ── SIMULATION EXEMPLE ────────────────────────
        // Colonnes clés: hospital_id,scenario_name,input_target_doctors,
        // input_target_nurses,input_target_beds,projections,recommendations,
        // kpis,statut,results_before,results_after
        DB::table('simulations')->insert([
            'hospital_id'            => $hospitalId,
            'scenario_name'          => 'Optimisation Urgences — Mai 2026',
            'input_target_doctors'   => 55,
            'input_target_nurses'    => 140,
            'input_target_beds'      => 350,
            'input_current_doctors'  => 48,
            'input_current_nurses'   => 124,
            'input_current_beds'     => 320,
            'input_active_patients'  => 267,
            'before_waiting_time'    => 34.2,
            'before_bed_occupancy'   => 91.1,
            'before_resource_util'   => 82.0,
            'before_throughput'      => 22.0,
            'before_coverage'        => 74.0,
            'before_rho_doctors'     => 0.82,
            'before_rho_beds'        => 0.91,
            'after_waiting_time'     => 21.4,
            'after_bed_occupancy'    => 78.4,
            'after_resource_util'    => 71.0,
            'after_throughput'       => 28.0,
            'after_coverage'         => 85.0,
            'after_rho_doctors'      => 0.68,
            'after_rho_beds'         => 0.78,
            'after_A2_dms'           => 3.8,
            'after_A4_temps_attente' => 21.4,
            'after_A8_lits_vacants'  => 18.6,
            'after_A9_transfert'     => 7.2,
            'after_C2_occupation'    => 78.4,
            'after_C3_mortalite'     => 1.9,
            'after_C4_infection'     => 3.1,
            'after_B1_cout_soins'    => 4820,
            'after_B4_cout_lit'      => 650,
            'after_B5_cout_med_eq'   => 1380000,
            'after_B7_cout_personnel'=> 6800000,
            'after_D5_distribution'  => 74,
            'after_D11_dechets'      => 71,
            'after_D12_localisation' => 81,
            'after_D13_air'          => 76,
            'after_D14_acoustique'   => 62,
            'kpis'                   => json_encode([
                'before' => [
                    'SSI'=>['A2_dms'=>4.7,'A4_temps_attente'=>34.2,'A8_lits_vacants'=>10.2,'A9_taux_transfert'=>11.9],
                    'IIP'=>['C2_occupation'=>91.1,'C3_mortalite'=>2.8,'C4_infection'=>4.2],
                    'ESI'=>['B1_cout_soins'=>5820,'B4_cout_lit'=>785,'B5_cout_med_eq'=>1580000,'B7_cout_personnel'=>7200000],
                    'TI' =>['D5_distribution_eq'=>68,'D11_gestion_dechets'=>71,'D12_localisation'=>81,'D13_air_interieur'=>72,'D14_acoustique'=>55],
                ],
                'after' => [
                    'SSI'=>['A2_dms'=>3.8,'A4_temps_attente'=>21.4,'A8_lits_vacants'=>18.6,'A9_taux_transfert'=>7.2],
                    'IIP'=>['C2_occupation'=>78.4,'C3_mortalite'=>1.9,'C4_infection'=>3.1],
                    'ESI'=>['B1_cout_soins'=>4820,'B4_cout_lit'=>650,'B5_cout_med_eq'=>1380000,'B7_cout_personnel'=>6800000],
                    'TI' =>['D5_distribution_eq'=>74,'D11_gestion_dechets'=>71,'D12_localisation'=>81,'D13_air_interieur'=>76,'D14_acoustique'=>62],
                ],
            ]),
            'results_before' => json_encode(['waiting_time_minutes'=>34.2,'bed_occupancy_rate'=>91.1,'resource_utilization'=>82.0,'throughput_patients'=>22,'service_coverage'=>74,'rho_doctors'=>0.82,'rho_beds'=>0.91,'lambda_rate'=>0.83,'mu_rate'=>0.167]),
            'results_after'  => json_encode(['waiting_time_minutes'=>21.4,'bed_occupancy_rate'=>78.4,'resource_utilization'=>71.0,'throughput_patients'=>28,'service_coverage'=>85,'rho_doctors'=>0.68,'rho_beds'=>0.78,'lambda_rate'=>0.83,'mu_rate'=>0.167]),
            'projections'    => json_encode([
                ['label'=>'M0', 'bed_occupancy'=>91,'resource_utilization'=>82,'service_coverage'=>74,'status'=>'critical'],
                ['label'=>'M1', 'bed_occupancy'=>85,'resource_utilization'=>78,'service_coverage'=>78,'status'=>'warning'],
                ['label'=>'M2', 'bed_occupancy'=>81,'resource_utilization'=>74,'service_coverage'=>82,'status'=>'warning'],
                ['label'=>'M3', 'bed_occupancy'=>78,'resource_utilization'=>71,'service_coverage'=>85,'status'=>'normal'],
                ['label'=>'M6', 'bed_occupancy'=>76,'resource_utilization'=>68,'service_coverage'=>88,'status'=>'normal'],
                ['label'=>'M9', 'bed_occupancy'=>74,'resource_utilization'=>66,'service_coverage'=>90,'status'=>'normal'],
                ['label'=>'M12','bed_occupancy'=>72,'resource_utilization'=>65,'service_coverage'=>91,'status'=>'normal'],
            ]),
            'recommendations'=> json_encode([
                ['title'=>'Renforcer le personnel Urgences','priority'=>'high','type'=>'staff','description'=>"Ajouter 4 médecins urgentistes et 8 infirmiers pour réduire le temps d'attente sous 20 min.",'action'=>'Recruter 4 urgentistes + 8 infirmiers','impact'=>'Temps attente 34→21 min (-38%)','triggerMonth'=>0],
                ['title'=>'Étendre la capacité en lits','priority'=>'high','type'=>'beds','description'=>'Ajouter 30 lits pour réduire le taux d\'occupation critique.','action'=>'Commander 30 lits supplémentaires','impact'=>'Occupation 91→78% (-13 points)','triggerMonth'=>1],
                ['title'=>'Protocole hygiène Chirurgie','priority'=>'medium','type'=>'protocol','description'=>'Taux infection 3.75% dépasse le seuil OMS 3.5%.','action'=>'Audit hygiène + formation équipe','impact'=>'Infections 3.75→3.1% (-17%)','triggerMonth'=>2],
                ['title'=>'Gestion DASRI Médecine Interne','priority'=>'medium','type'=>'environment','description'=>'Score DASRI 65/100 non conforme OMS.','action'=>'Formation + nouveaux conteneurs','impact'=>'Score DASRI 65→82/100 (+26%)','triggerMonth'=>1],
            ]),
            'statut'         => 'applique',
            'description'    => 'Simulation complète — Optimisation des Urgences du CHU',
            'target_doctors' => 55,
            'target_nurses'  => 140,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $this->command->info('✅ Seeder terminé avec succès !');
        $this->command->info('   🏥 CHU Ibn Badis · 4 services · 20 équipements · 5 alertes');
        $this->command->info('   👨‍⚕️ 7 staff · 1 budget · 24 snapshots KPIs · 1 simulation');
    }
}