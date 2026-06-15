from flask import Flask, request, jsonify
from flask_cors import CORS
from math import factorial, ceil

app = Flask(__name__)
CORS(app)

# ============================================================
# CONSTANTES
# ============================================================
CONSULTATION_MIN_H = 10 / 60
CONSULTATION_MAX_H = 30 / 60
SOIN_INF_MIN_H     = 25 / 60
SOIN_INF_MAX_H     = 35 / 60
EQUIP_MIN_H        = 25 / 60
EQUIP_MAX_H        = 35 / 60
DMS_MIN_H          = 24
DMS_MAX_H          = 1440
DMS_DEF_H          = 96
CAS_SPEC_MIN_H     = 2160
CAS_SPEC_MAX_H     = 4320


def clamp_dms(dms_h: float) -> float:
    return max(DMS_MIN_H, min(dms_h, DMS_MAX_H))


# ============================================================
# ERLANG-C M/M/c — Formule Bhattarai et al. (2025) ESIC Vol.9.1
# Retourne Wq en minutes
# ============================================================
def erlang_c_mmc(lambda_: float, mu: float, c: int) -> float:
    c = max(1, c)
    if c > 170: c = 170
    if mu <= 0 or lambda_ <= 0: return 0.0
    rho = lambda_ / (c * mu)
    if rho >= 1: return 9999.0
    try:
        a = lambda_ / mu
        sum_part    = sum(a**n / factorial(n) for n in range(c))
        erlang_part = a**c / (factorial(c) * (1 - rho))
        P0  = 1.0 / (sum_part + erlang_part)
        Lq  = (a**c * rho) / (factorial(c) * (1 - rho)**2) * P0
        Wq  = (Lq / lambda_) * 60
        return round(max(0.0, Wq), 2)
    except (OverflowError, ZeroDivisionError):
        return 9999.0


def calculer_dms_simulee(dms_terrain_moy_h: float, taux_occupation: float) -> float:
    if taux_occupation < 0.70:   f = 0.95
    elif taux_occupation < 0.90: f = 1.00
    else:                        f = 1.20
    return clamp_dms(round(dms_terrain_moy_h * f, 2))


# ============================================================
# CALCUL KPIs PAR SERVICE
# ============================================================
def compute_service_kpis(service_params: dict) -> dict:
    n   = max(0, service_params.get('patients', 0))
    b   = max(1, service_params.get('beds', 1))
    inf = max(0, service_params.get('nurses', 0))
    c_med = max(1, service_params.get('doctors', 1))

    dms_min_h = service_params.get('dms_min_h', DMS_MIN_H)
    dms_max_h = service_params.get('dms_max_h', DMS_MAX_H)
    dms_raw   = service_params.get('dms_heures', DMS_DEF_H)
    dms       = clamp_dms(dms_raw)

    consult_min_h = service_params.get('consultation_min_h', CONSULTATION_MIN_H)
    consult_max_h = service_params.get('consultation_max_h', CONSULTATION_MAX_H)
    consult_moy_h = (consult_min_h + consult_max_h) / 2

    soin_inf_min_h = service_params.get('soin_inf_min_h', SOIN_INF_MIN_H)
    soin_inf_max_h = service_params.get('soin_inf_max_h', SOIN_INF_MAX_H)
    soin_inf_moy_h = (soin_inf_min_h + soin_inf_max_h) / 2

    equip_min_h = service_params.get('equip_min_h', EQUIP_MIN_H)
    equip_max_h = service_params.get('equip_max_h', EQUIP_MAX_H)
    equip_moy_h = (equip_min_h + equip_max_h) / 2

    lambda_patients_jour = service_params.get('lambda_patients_jour', 35)
    simulation_hours     = service_params.get('simulation_hours', 8)

    equipment_list = service_params.get('equipment_list', [])
    mort_base      = service_params.get('mortalite_base', 1.5)

    # Auto-détection simulation_hours si non fourni par le frontend
    # Urgences/Réanimation = service 24h | Autres = consultation 7h-15h = 8h
    sim_h_auto = 24 if (dms < 48 or mort_base > 5.0) else 8
    simulation_hours = service_params.get('simulation_hours', sim_h_auto)

    # ── Taux de service par ressource ────────────────────────
    mu_med = 1.0 / consult_moy_h   if consult_moy_h > 0   else 1.0
    mu_inf = 1.0 / soin_inf_moy_h  if soin_inf_moy_h > 0  else 1.0
    mu_eq  = 1.0 / equip_moy_h     if equip_moy_h > 0     else 1.0

    # ── D5 et liste équipements ───────────────────────────────
    if equipment_list:
        total_q = sum(eq.get('quantite', 1) for eq in equipment_list)
        op_q    = sum(eq.get('quantite', 1) for eq in equipment_list
                      if eq.get('statut', 'operational') == 'operational')
        D5 = round((op_q / max(total_q, 1)) * service_params.get('score_distribution_eq', 80), 1)
    else:
        eq_total = max(1, service_params.get('equipment_count', 1))
        eq_op    = max(0, service_params.get('equipment_operational', eq_total))
        D5       = round((eq_op / eq_total) * 100, 1)

    # ================================================================
    # CALCUL A4 — 3 files Erlang-C M/M/c + MAX
    #
    # Principe : patient attend successivement 3 ressources.
    # A4 = MAX(Wq_médecin, Wq_infirmier, Wq_équipement)
    # Le MAX identifie le GOULOT (ressource la plus chargée).
    #
    # Références :
    #   Bhattarai et al. (2025) ESIC Vol.9.1  — formule Erlang-C
    #   Green L.V. (2006) Springer            — files en série
    #   Needleman et al. (2002) NEJM 346(22)  — infirmiers
    #   Hung et al. (2007) Ann Emerg Med 49(3)— équipements
    #   WHO (2008) Emergency care systems     — sévérité/triage
    # ================================================================

    # λ = patients de consultation par heure (7h-15h = 8h)
    lambda_consult = lambda_patients_jour / max(simulation_hours, 1)

    # ── FILE 1 : MÉDECINS ─────────────────────────────────────
    # c = médecins en salle de consultation (dérivé de la charge)
    # c_doc proportionnel : ~1 médecin consultation pour 8 médecins totaux
    c_doc = max(1, round(c_med / 8))
    rho_doc = lambda_consult / max(c_doc * mu_med, 0.001)
    if rho_doc >= 1.0:
        Wq_doc = min(300.0, rho_doc * 60.0)   # saturé (3h+)
    else:
        Wq_doc = erlang_c_mmc(lambda_consult, mu_med, c_doc)

    # ── FILE 2 : INFIRMIERS ───────────────────────────────────
    # c = infirmiers en consultation (dérivé de la charge)
    # c_inf proportionnel : ~1 infirmier consultation pour 6 infirmiers totaux
    c_inf_consult = max(1, min(
        round(inf / 6) if inf > 0 else 1,
        ceil(lambda_consult / (mu_inf * 0.70))
    ))
    rho_inf = lambda_consult / max(c_inf_consult * mu_inf, 0.001)
    if rho_inf >= 1.0:
        Wq_inf = min(300.0, rho_inf * 60.0)
    else:
        Wq_inf = erlang_c_mmc(lambda_consult, mu_inf, c_inf_consult)

    # ── FILE 3 : ÉQUIPEMENTS ──────────────────────────────────
    # Chaque équipement a sa propre file Erlang-C
    # A4_eq = MAX parmi tous les équipements (goulot équipement)
    Wq_eq_list = []
    if equipment_list:
        for eq in equipment_list:
            q         = max(1, eq.get('quantite', 1))
            p_j       = eq.get('patients_par_jour', 1)
            d_min     = eq.get('duree_utilisation_min', 15) / 60
            d_max     = eq.get('duree_utilisation_max', 30) / 60
            d_moy     = (d_min + d_max) / 2
            statut    = eq.get('statut', 'operational')
            mu_eq_i   = 1.0 / d_moy if d_moy > 0 else 1.0
            lam_eq_i  = p_j / max(simulation_hours, 1)
            if statut == 'operational' and q > 0:
                Wq_eq_i = erlang_c_mmc(lam_eq_i, mu_eq_i, q)
            else:
                Wq_eq_i = 300.0   # équipement non disponible → long
            Wq_eq_list.append(Wq_eq_i)
    else:
        eq_op    = max(1, service_params.get('equipment_operational',
                       service_params.get('equipment_count', 1)))
        lam_eq_d = lambda_consult * 0.10  # ~10% patients ont besoin d'équipement
        c_eq_d   = max(1, min(eq_op, ceil(lam_eq_d / max(mu_eq * 0.70, 0.001))))
        Wq_eq_d  = erlang_c_mmc(lam_eq_d, mu_eq, c_eq_d)
        Wq_eq_list.append(Wq_eq_d)

    Wq_eq = max(Wq_eq_list) if Wq_eq_list else 0.0

    # ── A4 = MAX des 3 files (GOULOT) ────────────────────────
    # Le MAX identifie la ressource limitante
    A4_raw = max(Wq_doc, Wq_inf, Wq_eq)

    # Facteur sévérité : services critiques ont priorité → A4 ↓
    # Réanimation (mort > 5%) : prise en charge immédiate
    if mort_base > 5.0:
        f_sev = max(0.25, 1.5 / mort_base)
    else:
        f_sev = 1.0

    wait_time = round(max(5.0, min(A4_raw * f_sev, 999.0)), 1)

    # Pour affichage DES metrics
    A4_med         = round(Wq_doc, 1)
    A4_inf         = round(Wq_inf, 1)
    A4_equip_final = round(Wq_eq, 1)

    # ================================================================

    lambda_rate = lambda_patients_jour / 24.0
    rho_d = min(lambda_rate / max(c_med * mu_med, 0.001), 0.95)
    rho_b = min(lambda_rate / max(b * (1.0 / dms), 0.001), 0.95)

    dms_terrain_moy = (dms_min_h + dms_max_h) / 2
    dms_simulee = calculer_dms_simulee(dms_terrain_moy, min(n / b, 1.0) if b > 0 else 0)
    A2 = round(dms_simulee / 24, 1)
    A4 = wait_time
    A8 = round(max(0, (b - n) / max(b, 1) * 100), 1)

    if rho_b < 0.70:   A9 = 2.0
    elif rho_b < 0.85: A9 = 5.0 + (rho_b - 0.70) * 20
    else:              A9 = 10.0 + (rho_b - 0.85) * 30
    A9 = round(min(A9, 25.0), 1)

    C2 = round(min(n / b * 100, 100.0), 1)

    ratio_mp = c_med / max(n, 1)
    if ratio_mp >= 0.3:    f_med_mort = 0.80
    elif ratio_mp >= 0.15: f_med_mort = 1.00
    elif ratio_mp >= 0.05: f_med_mort = 1.30
    else:                  f_med_mort = 1.80
    f_att = 1.00 if wait_time < 15 else (1.10 if wait_time < 30 else 1.25)
    C3 = round(min(((mort_base/100)*n * f_med_mort * f_att) / max(n,1) * 100, 15.0), 2)

    if C2 < 70:   foi = 0.80
    elif C2 < 85: foi = 1.00
    else:         foi = 1.30
    f_inf_c4 = max(0.70, 1.0 - (inf/max(n,1)) * 0.30)
    C4 = round(min((4.0/100)*n*foi*f_inf_c4/max(n,1)*100, 15.0), 2)

    sal_med  = service_params.get('salaire_medecin', 180000)
    sal_inf  = service_params.get('salaire_infirmier', 80000)
    c_med_u  = service_params.get('cout_medicament_unit', 1500)
    c_maint  = service_params.get('cout_maintenance_eq', 50000)
    budget   = service_params.get('budget_service', 5000000)
    eq_total = max(1, service_params.get('equipment_count', 1))

    B7 = round((c_med * sal_med + inf * sal_inf) * 1.28)
    B5 = round(n * c_med_u * 30 + eq_total * c_maint)
    B1 = round(budget / n) if n > 0 else 0
    B4 = round(budget / (b * 30))

    D11 = service_params.get('score_gestion_dechets', 85)
    D12 = service_params.get('score_localisation', 80)
    D13 = service_params.get('score_air_interieur', 75)
    D14 = service_params.get('score_acoustique', 70)

    if C2 >= 90 or rho_d*100 >= 90:   statut = 'critique'
    elif C2 >= 75 or rho_d*100 >= 75: statut = 'attention'
    else:                              statut = 'normal'

    return {
        'SSI': {'A2_dms': A2, 'A4_temps_attente': A4,
                'A8_lits_vacants': A8, 'A9_taux_transfert': A9},
        'IIP': {'C2_occupation': C2, 'C3_mortalite': C3, 'C4_infection': C4},
        'ESI': {'B1_cout_soins': B1, 'B4_cout_lit': B4,
                'B5_cout_med_eq': B5, 'B7_cout_personnel': B7},
        'TI':  {'D5_distribution_eq': D5, 'D11_gestion_dechets': D11,
                'D12_localisation': D12, 'D13_air_interieur': D13,
                'D14_acoustique': D14},
        'DES': {
            'lambda_rate':    round(lambda_rate, 3),
            'rho_doctors':    round(rho_d, 3),
            'rho_beds':       round(rho_b, 3),
            'A4_medecins':    A4_med,
            'A4_infirmiers':  A4_inf,
            'A4_equipements': A4_equip_final,
        },
        'statut': statut,
        'dms_info': {
            'dms_heures':            dms,
            'dms_simulee_heures':    dms_simulee,
            'dms_jours':             A2,
            'dms_terrain_min_jours': round(dms_min_h/24, 1),
            'dms_terrain_max_jours': round(dms_max_h/24, 1),
            'dans_plage_reelle':     DMS_MIN_H <= dms_raw <= DMS_MAX_H,
        },
        'consultation_info': {
            'min_minutes': round(consult_min_h*60, 1),
            'max_minutes': round(consult_max_h*60, 1),
            'moy_minutes': round(consult_moy_h*60, 1),
        }
    }


# ============================================================
# SIMULATION GLOBALE
# ============================================================
def run_des_simulation(params: dict) -> dict:
    total_beds   = params.get('total_beds', 100)
    total_docs   = params.get('total_doctors', 20)
    total_nurses = params.get('total_nurses', 40)
    n            = params.get('active_patients', 80)
    dms_raw      = params.get('dms_heures', DMS_DEF_H)
    dms          = clamp_dms(dms_raw)
    eq_curr      = max(0, params.get('current_equipment', 10))

    lambda_patients_jour = params.get('lambda_patients_jour', 35)
    simulation_hours     = params.get('simulation_hours', 8)

    consult_min_h = params.get('consultation_min_h', CONSULTATION_MIN_H)
    consult_max_h = params.get('consultation_max_h', CONSULTATION_MAX_H)
    consult_moy_h = (consult_min_h + consult_max_h) / 2
    mu_med = 1.0 / consult_moy_h if consult_moy_h > 0 else 1.0

    soin_inf_min_h = params.get('soin_inf_min_h', SOIN_INF_MIN_H)
    soin_inf_max_h = params.get('soin_inf_max_h', SOIN_INF_MAX_H)
    soin_inf_moy_h = (soin_inf_min_h + soin_inf_max_h) / 2
    mu_inf = 1.0 / soin_inf_moy_h if soin_inf_moy_h > 0 else 1.0

    equip_min_h = params.get('equip_min_h', EQUIP_MIN_H)
    equip_max_h = params.get('equip_max_h', EQUIP_MAX_H)
    equip_moy_h = (equip_min_h + equip_max_h) / 2
    mu_eq = 1.0 / equip_moy_h if equip_moy_h > 0 else 1.0

    lambda_consult = lambda_patients_jour / max(simulation_hours, 1)

    # File médecins
    c_doc_g = max(1, round(total_docs / 8))
    rho_g   = lambda_consult / max(c_doc_g * mu_med, 0.001)
    Wq_doc_g = erlang_c_mmc(lambda_consult, mu_med, c_doc_g) if rho_g < 1 else min(120, rho_g*60)

    # File infirmiers
    c_inf_g  = max(1, min(round(total_nurses / 6), ceil(lambda_consult / (mu_inf * 0.70))))
    rho_ig   = lambda_consult / max(c_inf_g * mu_inf, 0.001)
    Wq_inf_g = erlang_c_mmc(lambda_consult, mu_inf, c_inf_g) if rho_ig < 1 else min(120, rho_ig*60)

    # File équipements
    lam_eq_g = lambda_consult * 0.5
    Wq_eq_g  = erlang_c_mmc(lam_eq_g, mu_eq, max(1, eq_curr))

    wt = round(min(max(5.0, max(Wq_doc_g, Wq_inf_g, Wq_eq_g)), 120.0), 1)

    lambda_rate = lambda_patients_jour / 24.0
    mu_med_full = 1.0 / consult_moy_h if consult_moy_h > 0 else 1.0
    rho_d = min(lambda_rate / max(total_docs * mu_med_full, 0.001), 0.95)
    rho_b = min(lambda_rate / max(total_beds * (1.0 / dms), 0.001), 0.95)

    bed_occ    = round(min((n / max(total_beds, 1)) * 100, 100.0), 1)
    throughput = round(n * (1 - rho_b), 1)
    coverage   = round(min(100, (total_docs*5 + total_nurses*2 + eq_curr*0.5) / max(n,1) * 10), 1)

    return {
        'waiting_time_minutes': wt,
        'bed_occupancy_rate':   bed_occ,
        'throughput_patients':  throughput,
        'resource_utilization': round(rho_d * 100, 1),
        'service_coverage':     coverage,
        'lambda_rate':          round(lambda_rate, 3),
        'mu_rate':              round(mu_med_full, 4),
        'rho_doctors':          round(rho_d, 3),
        'rho_beds':             round(rho_b, 3),
        'dms_jours':            round(dms / 24, 1),
    }


# ============================================================
# KPIs ENRICHIS GLOBAUX
# ============================================================
def compute_enriched_kpis(results: dict, params: dict) -> dict:
    n       = params.get('active_patients', 80)
    c       = params.get('total_doctors', 20)
    inf     = params.get('total_nurses', 40)
    b       = params.get('total_beds', 100)
    eq      = params.get('total_equipment', 10)
    eq_curr = params.get('current_equipment', eq)
    sal_med = params.get('salaire_medecin', 180000)
    sal_inf = params.get('salaire_infirmier', 80000)
    c_med_u = params.get('cout_medicament_unit', 1500)
    c_maint = params.get('cout_maintenance_eq', 50000)
    budget  = params.get('budget_annuel', 500000000)
    mort_b  = params.get('mortalite_base', 1.5)
    dms     = clamp_dms(params.get('dms_heures', DMS_DEF_H))

    dms_min_h       = params.get('dms_min_h', DMS_MIN_H)
    dms_max_h       = params.get('dms_max_h', DMS_MAX_H)
    dms_terrain_moy = (dms_min_h + dms_max_h) / 2

    wt   = results['waiting_time_minutes']
    C2   = round(min(results['bed_occupancy_rate'], 100.0), 1)
    rho_b_r = results['rho_beds']

    dms_simulee = calculer_dms_simulee(dms_terrain_moy, C2/100)
    A2 = round(dms_simulee / 24, 1)
    A4 = wt
    A8 = round(max(0, (b - n) / max(b, 1) * 100), 1)

    if rho_b_r < 0.70:   A9 = 2.0
    elif rho_b_r < 0.85: A9 = 5.0 + (rho_b_r - 0.70) * 20
    else:                 A9 = 10.0 + (rho_b_r - 0.85) * 30
    A9 = round(min(A9, 25.0), 1)

    f_att = 1.00 if wt < 15 else (1.15 if wt < 30 else 1.30)
    C3 = round(((mort_b/100)*n*f_att/max(n,1))*100, 2)

    if C2 < 70:   foi = 0.80
    elif C2 < 85: foi = 1.00
    else:         foi = 1.30
    f_inf_c4 = max(0.70, 1.0-(inf/max(n,1))*0.30)
    C4 = round(min((4.0/100)*n*foi*f_inf_c4/max(n,1)*100, 15.0), 2)

    B7 = round((c*sal_med + inf*sal_inf)*1.28)
    B5 = round(n*c_med_u*30 + eq*c_maint)
    B1 = round(budget/max(12*max(n,1),1))
    B4 = round(budget/max(b*365,1))
    D5 = round((eq_curr/max(eq,1))*100, 1)

    return {
        'SSI': {'A2_dms': A2, 'A4_temps_attente': A4,
                'A8_lits_vacants': A8, 'A9_taux_transfert': A9},
        'IIP': {'C2_occupation': C2, 'C3_mortalite': C3, 'C4_infection': C4},
        'ESI': {'B1_cout_soins': B1, 'B4_cout_lit': B4,
                'B5_cout_med_eq': B5, 'B7_cout_personnel': B7},
        'TI':  {'D5_distribution_eq': D5,
                'D11_gestion_dechets': params.get('score_gestion_dechets', 85),
                'D12_localisation':   params.get('score_localisation', 80),
                'D13_air_interieur':  params.get('score_air_interieur', 75),
                'D14_acoustique':     params.get('score_acoustique', 70)},
    }


# ============================================================
# PROJECTIONS 12 MOIS
# ============================================================
def compute_projections(after_params: dict, after_results: dict) -> list:
    projections = []
    base_n   = after_params['active_patients']
    base_d   = after_params['total_doctors']
    base_inf = after_params['total_nurses']
    base_b   = after_params['total_beds']
    base_eq  = after_params['total_equipment']
    dms      = clamp_dms(after_params.get('dms_heures', DMS_DEF_H))

    for month, label in [(0,'Maintenant'),(1,'Mois 1'),(3,'Mois 3'),(6,'Mois 6'),(12,'Mois 12')]:
        n_m   = round(base_n   * (1.02 ** month))
        eq_m  = max(1, round(base_eq  * (0.97 ** month)))
        d_m   = max(1, round(base_d   * (0.99 ** month)))
        inf_m = max(1, round(base_inf * (0.99 ** month)))

        proj_p = {**after_params, 'active_patients': n_m, 'total_doctors': d_m,
                  'total_nurses': inf_m, 'total_equipment': eq_m,
                  'current_equipment': eq_m, 'dms_heures': dms}
        res       = run_des_simulation(proj_p)
        kpis_proj = compute_enriched_kpis(res, proj_p)

        if res['bed_occupancy_rate'] >= 90 or res['rho_doctors']*100 >= 90 or res['service_coverage'] < 50:
            status = 'critical'
        elif res['bed_occupancy_rate'] >= 75 or res['rho_doctors']*100 >= 75 or res['service_coverage'] < 65:
            status = 'warning'
        else:
            status = 'normal'

        projections.append({
            'month': month, 'label': label, 'status': status,
            'waiting_time':         res['waiting_time_minutes'],
            'bed_occupancy':        res['bed_occupancy_rate'],
            'resource_utilization': res['resource_utilization'],
            'service_coverage':     res['service_coverage'],
            'rho_doctors':          res['rho_doctors'],
            'rho_beds':             res['rho_beds'],
            'kpis': kpis_proj,
            'factors': {
                'active_patients':       n_m, 'effective_doctors':    d_m,
                'effective_nurses':      inf_m, 'effective_equipment': eq_m,
                'patient_growth_pct':    round(0.02*month*100, 1),
                'equipment_failure_pct': round(0.03*month*100, 1),
                'staff_turnover_pct':    round(0.01*month*100, 1),
            },
        })
    return projections


# ============================================================
# RECOMMANDATIONS
# ============================================================
def generate_recommendations(after_results: dict, projections: list, after_params: dict) -> list:
    recs    = []
    bed_occ = after_results['bed_occupancy_rate']
    rho_doc = after_results['rho_doctors'] * 100
    wait    = after_results['waiting_time_minutes']
    eq      = after_params.get('current_equipment', 10)
    n       = after_params.get('active_patients', 80)
    eq_ratio = eq / max(n, 1)
    dms_j   = round(clamp_dms(after_params.get('dms_heures', DMS_DEF_H)) / 24, 1)

    if bed_occ >= 85:
        recs.append({'priority':'high','type':'beds','icon':'bed',
            'title':'Capacite lits critique',
            'description':f"Occupation a {bed_occ}% (seuil 85%).",
            'action':f"Augmentez la capacite de {max(5,round((bed_occ-75)/100*after_params.get('total_beds',100)))} lits.",
            'impact':'Reduction 15-20% du temps attente.','triggerMonth':0})
    elif bed_occ >= 70:
        recs.append({'priority':'medium','type':'beds','icon':'bed',
            'title':'Surveillance occupation lits',
            'description':f"Occupation a {bed_occ}%.",
            'action':'Planifiez des lits supplementaires.',
            'impact':'Prevention saturation.','triggerMonth':1})
    if rho_doc >= 85:
        recs.append({'priority':'high','type':'staff','icon':'stethoscope',
            'title':'Surcharge medecins',
            'description':f"Utilisation medecins a {round(rho_doc,1)}%.",
            'action':f"Recrutez {max(2,round((rho_doc-70)/10))} medecins.",
            'impact':'Reduction erreurs medicales.','triggerMonth':0})
    if wait > 30:
        recs.append({'priority':'high','type':'process','icon':'clock',
            'title':'Temps attente depasse 30 min',
            'description':f"A4 = {wait} min.",
            'action':'Augmentez le personnel en consultation.',
            'impact':'Reduction 30-40% du temps attente.','triggerMonth':0})
    elif wait > 20:
        recs.append({'priority':'medium','type':'process','icon':'clock',
            'title':'Temps attente eleve',
            'description':f"A4 = {wait} min.",
            'action':'Reorganisez les plannings.',
            'impact':'Retour dans la plage normale.','triggerMonth':1})
    if dms_j > 30:
        recs.append({'priority':'medium','type':'process','icon':'activity',
            'title':'DMS elevee',
            'description':f"DMS simulee de {dms_j} jours.",
            'action':'Analysez les causes de sejour prolonge.',
            'impact':'Amelioration rotation lits.','triggerMonth':1})
    if eq_ratio < 0.1:
        recs.append({'priority':'high','type':'equipment','icon':'settings',
            'title':'Equipements insuffisants',
            'description':f"Ratio eq/patients critique ({round(eq_ratio,2)}).",
            'action':'Augmentez equipements operationnels.',
            'impact':'Amelioration qualite soins.','triggerMonth':0})
    critiques = [p for p in projections if p['status'] == 'critical']
    if critiques:
        fc = critiques[0]
        recs.append({'priority':'high','type':'process','icon':'alert-triangle',
            'title':f"Alerte critique prevue au {fc['label']}",
            'description':f"Saturation prevue au {fc['label']}.",
            'action':'Planifiez une revision avant cette echeance.',
            'impact':'Prevention crise operationnelle.','triggerMonth':fc['month']})
    recs.sort(key=lambda r: {'high':0,'medium':1,'low':2}.get(r['priority'],3))
    return recs


# ============================================================
# ROUTE PRINCIPALE — POST /simulate
# ============================================================
@app.route('/simulate', methods=['POST'])
def simulate():
    data = request.get_json()

    hospital_id   = data.get('hospital_id')
    scenario_name = data.get('scenario_name', 'Scenario personnalise')
    budget_annuel = data.get('budget_annuel', 500000000)
    sal_med       = data.get('salaire_medecin', 180000)
    sal_inf       = data.get('salaire_infirmier', 80000)
    cout_med      = data.get('cout_medicament_unit', 1500)
    mort_base     = data.get('mortalite_base', 1.5)

    services_data = data.get('services', [])
    if services_data:
        patients_normaux = [(s.get('dms_heures', DMS_DEF_H), s.get('patients', 0))
                            for s in services_data
                            if not s.get('is_special_case', False)
                            and DMS_MIN_H <= s.get('dms_heures', DMS_DEF_H) <= DMS_MAX_H]
        total_p    = sum(p for _, p in patients_normaux)
        dms_global = (sum(d*p for d,p in patients_normaux)/total_p
                      if total_p > 0 else clamp_dms(data.get('dms_heures', DMS_DEF_H)))
    else:
        dms_global = clamp_dms(data.get('dms_heures', DMS_DEF_H))

    common = {
        'simulation_hours':      data.get('simulation_hours', 8),
        'dms_heures':            dms_global,
        'dms_min_h':             data.get('dms_min_h', DMS_MIN_H),
        'dms_max_h':             data.get('dms_max_h', DMS_MAX_H),
        'consultation_min_h':    data.get('consultation_min_h', CONSULTATION_MIN_H),
        'consultation_max_h':    data.get('consultation_max_h', CONSULTATION_MAX_H),
        'soin_inf_min_h':        data.get('soin_inf_min_h', SOIN_INF_MIN_H),
        'soin_inf_max_h':        data.get('soin_inf_max_h', SOIN_INF_MAX_H),
        'equip_min_h':           data.get('equip_min_h', EQUIP_MIN_H),
        'equip_max_h':           data.get('equip_max_h', EQUIP_MAX_H),
        'budget_annuel':         budget_annuel,
        'salaire_medecin':       sal_med,
        'salaire_infirmier':     sal_inf,
        'cout_medicament_unit':  cout_med,
        'cout_maintenance_eq':   data.get('cout_maintenance_eq', 50000),
        'mortalite_base':        mort_base,
        'score_localisation':    data.get('score_localisation', 80),
        'score_air_interieur':   data.get('score_air_interieur', 75),
        'score_acoustique':      data.get('score_acoustique', 70),
        'score_distribution_eq': data.get('score_distribution_eq', 80),
        'score_gestion_dechets': data.get('score_gestion_dechets', 85),
    }

    before_params = {**common,
        'total_beds':           data.get('current_beds', 100),
        'total_doctors':        data.get('current_doctors', 20),
        'total_nurses':         data.get('current_nurses', 40),
        'total_equipment':      data.get('current_equipment', 10),
        'current_equipment':    data.get('current_equipment', 10),
        'active_patients':      data.get('active_patients', 80),
        'lambda_patients_jour': data.get('lambda_patients_jour', 35),
    }

    if services_data:
        svcs_normaux    = [s for s in services_data if not s.get('is_special_case', False)]
        target_doctors  = sum(s.get('doctors', 0)  for s in svcs_normaux)
        target_nurses   = sum(s.get('nurses', 0)   for s in svcs_normaux)
        target_beds     = sum(s.get('beds', 0)      for s in svcs_normaux)
        target_patients = sum(s.get('patients', 0) for s in svcs_normaux)
        target_eq = sum(
            sum(e.get('quantity',0) for e in s.get('equipment',[]) if e.get('status')=='operational')
            for s in svcs_normaux)
        if target_eq == 0:
            target_eq = data.get('available_equipment', before_params['total_equipment'])
    else:
        target_doctors  = data.get('target_doctors',  before_params['total_doctors'])
        target_nurses   = data.get('target_nurses',   before_params['total_nurses'])
        target_beds     = data.get('target_beds',     before_params['total_beds'])
        target_patients = data.get('active_patients', before_params['active_patients'])
        target_eq       = data.get('available_equipment', before_params['total_equipment'])

    after_params = {**common,
        'total_beds':           target_beds      if target_beds > 0      else before_params['total_beds'],
        'total_doctors':        target_doctors   if target_doctors > 0   else before_params['total_doctors'],
        'total_nurses':         target_nurses    if target_nurses > 0    else before_params['total_nurses'],
        'total_equipment':      target_eq        if target_eq > 0        else before_params['total_equipment'],
        'current_equipment':    target_eq        if target_eq > 0        else before_params['total_equipment'],
        'active_patients':      target_patients  if target_patients > 0  else before_params['active_patients'],
        'lambda_patients_jour': data.get('lambda_patients_jour', 35),
    }

    results_before = run_des_simulation(before_params)
    results_after  = run_des_simulation(after_params)
    kpis_before    = compute_enriched_kpis(results_before, before_params)
    kpis_after     = compute_enriched_kpis(results_after,  after_params)

    services_kpis      = []
    special_cases_kpis = []
    nb_services = max(len(services_data), 1)

    for svc in services_data:
        budget_svc     = budget_annuel / 12 / nb_services
        eq_list        = svc.get('equipment', [])
        eq_total       = sum(e.get('quantity',0) for e in eq_list)
        eq_operational = sum(e.get('quantity',0) for e in eq_list if e.get('status')=='operational')
        is_special     = svc.get('is_special_case', False)
        dms_svc        = svc.get('dms_heures', DMS_DEF_H)
        if not is_special:
            dms_svc = clamp_dms(dms_svc)

        svc_params = {**common,
            'patients':              svc.get('patients', 0),
            'doctors':               svc.get('doctors', 1),
            'nurses':                svc.get('nurses', 0),
            'beds':                  svc.get('beds', 1),
            'dms_heures':            dms_svc,
            'dms_min_h':             svc.get('dms_min_h', DMS_MIN_H),
            'dms_max_h':             svc.get('dms_max_h', DMS_MAX_H),
            'simulation_hours':      svc.get('simulation_hours', 8),
            'consultation_min_h':    svc.get('consultation_min_h', CONSULTATION_MIN_H),
            'consultation_max_h':    svc.get('consultation_max_h', CONSULTATION_MAX_H),
            'soin_inf_min_h':        svc.get('soin_inf_min_h', SOIN_INF_MIN_H),
            'soin_inf_max_h':        svc.get('soin_inf_max_h', SOIN_INF_MAX_H),
            'equip_min_h':           svc.get('equip_min_h', EQUIP_MIN_H),
            'equip_max_h':           svc.get('equip_max_h', EQUIP_MAX_H),
            'mortalite_base':        svc.get('mortalite_base', mort_base),
            'score_distribution_eq': svc.get('score_distribution_eq', 80),
            'score_gestion_dechets': svc.get('score_gestion_dechets', 85),
            'budget_service':        budget_svc,
            'equipment_count':       eq_total,
            'equipment_operational': eq_operational,
            'salaire_medecin':       svc.get('salaire_medecin', sal_med),
            'salaire_infirmier':     svc.get('salaire_infirmier', sal_inf),
            'cout_medicament_unit':  svc.get('cout_medicament_unit', cout_med),
            'cout_maintenance_eq':   svc.get('cout_maintenance_eq', 50000),
            'equipment_list':        svc.get('equipment_list', []),
            'lambda_patients_jour':  svc.get('lambda_patients_jour', 35),
        }
        svc_kpis = compute_service_kpis(svc_params)

        entry = {
            'service_id':      svc.get('id'),
            'service_name':    svc.get('name', ''),
            'service_id_real': svc.get('id'),
            'doctors':         svc.get('doctors', 0),
            'nurses':          svc.get('nurses', 0),
            'beds':            svc.get('beds', 0),
            'patients':        svc.get('patients', 0),
            'dms_heures':      dms_svc,
            'dms_jours':       round(dms_svc/24, 1),
            'statut':          svc_kpis['statut'],
            'kpis':            svc_kpis,
            'is_special_case': is_special,
        }
        if is_special:
            entry['special_case_type'] = svc.get('special_case_type', 'cas_particulier')
            special_cases_kpis.append(entry)
        else:
            services_kpis.append(entry)

    original_services = data.get('original_services', [])
    orig_map = {s.get('id'): s for s in original_services}

    for entry in services_kpis:
        orig = orig_map.get(entry.get('service_id'))
        if orig:
            svc_data = next((s for s in services_data if s.get('id')==entry.get('service_id')), {})
            orig_p = {
                **{k:v for k,v in svc_data.items() if k not in ('patients','beds','doctors','nurses')},
                'patients': orig.get('patients', svc_data.get('patients',0)),
                'beds':     orig.get('beds',     svc_data.get('beds',1)),
                'doctors':  orig.get('doctors',  svc_data.get('doctors',1)),
                'nurses':   orig.get('nurses',   svc_data.get('nurses',0)),
                'score_distribution_eq': orig.get('score_distribution_eq', svc_data.get('score_distribution_eq',75)),
                'score_gestion_dechets': orig.get('score_gestion_dechets', svc_data.get('score_gestion_dechets',85)),
            }
            bk = compute_service_kpis(orig_p)
            entry['kpis_before'] = {'SSI': bk['SSI'], 'IIP': bk['IIP'], 'TI': bk['TI']}
        else:
            entry['kpis_before'] = None

    if services_kpis:
        total_p_svc = sum(s['patients'] for s in services_kpis)
        total_l_svc = sum(s['beds']     for s in services_kpis)

        A4_g   = max(s['kpis']['SSI']['A4_temps_attente'] for s in services_kpis)
        A2_g   = round(sum(s['kpis']['SSI']['A2_dms']*s['patients'] for s in services_kpis)/max(total_p_svc,1),1)
        A8_g   = round(max(0,(total_l_svc-total_p_svc)/max(total_l_svc,1)*100),1)
        A9_g   = round(sum(s['kpis']['SSI']['A9_taux_transfert']*s['patients'] for s in services_kpis)/max(total_p_svc,1),1)
        C2_g   = round(min(total_p_svc/max(total_l_svc,1)*100,100.0),1)
        C3_g   = round(sum(s['kpis']['IIP']['C3_mortalite']*s['patients'] for s in services_kpis)/max(total_p_svc,1),2)
        C4_g   = round(sum(s['kpis']['IIP']['C4_infection']*s['patients'] for s in services_kpis)/max(total_p_svc,1),2)
        D5_g   = round(sum(s['kpis']['TI']['D5_distribution_eq'] for s in services_kpis)/len(services_kpis),1)
        D11_g  = round(sum(s['kpis']['TI']['D11_gestion_dechets'] for s in services_kpis)/len(services_kpis),1)

        kpis_after['SSI'].update({'A2_dms':A2_g,'A4_temps_attente':A4_g,'A8_lits_vacants':A8_g,'A9_taux_transfert':A9_g})
        kpis_after['IIP'].update({'C2_occupation':C2_g,'C3_mortalite':C3_g,'C4_infection':C4_g})
        kpis_after['TI'].update({'D5_distribution_eq':D5_g,'D11_gestion_dechets':D11_g})
        results_after['waiting_time_minutes'] = A4_g
        results_after['bed_occupancy_rate']   = C2_g

        if original_services:
            op = sum(s.get('patients',0) for s in original_services)
            ob = sum(s.get('beds',1)     for s in original_services)
            kpis_before['SSI']['A8_lits_vacants'] = round(max(0,(ob-op)/max(ob,1)*100),1)
            C2_br = round(min(op/max(ob,1)*100,100.0),1)
        else:
            ti = sum(s.get('patients',0) for s in services_data if not s.get('is_special_case',False))
            bi = sum(s.get('beds',1)     for s in services_data if not s.get('is_special_case',False))
            C2_br = round(min(ti/max(bi,1)*100,100.0),1)

        swb = [s for s in services_kpis if s.get('kpis_before')]
        if swb:
            tp = max(sum(s['patients'] for s in swb),1)
            kpis_before['SSI']['A2_dms']           = round(sum(s['kpis_before']['SSI']['A2_dms']*s['patients'] for s in swb)/tp,1)
            kpis_before['SSI']['A4_temps_attente']  = round(max(s['kpis_before']['SSI']['A4_temps_attente'] for s in swb),1)
            kpis_before['IIP']['C3_mortalite']      = round(sum(s['kpis_before']['IIP']['C3_mortalite']*s['patients'] for s in swb)/tp,2)
            kpis_before['IIP']['C4_infection']      = round(sum(s['kpis_before']['IIP']['C4_infection']*s['patients'] for s in swb)/tp,2)
            kpis_before['TI']['D5_distribution_eq'] = round(sum(s['kpis_before']['TI']['D5_distribution_eq'] for s in swb)/len(swb),1)
            kpis_before['TI']['D11_gestion_dechets']= round(sum(s['kpis_before']['TI']['D11_gestion_dechets'] for s in swb)/len(swb),1)
        else:
            kpis_before['SSI']['A4_temps_attente'] = results_before['waiting_time_minutes']
        kpis_before['IIP']['C2_occupation'] = C2_br

    def imp(bv, av, lib=True):
        if bv == 0: return 0
        return round(((bv-av)/bv*100) if lib else ((av-bv)/bv*100), 1)

    improvements = {
        'waiting_time':         imp(results_before['waiting_time_minutes'], results_after['waiting_time_minutes']),
        'bed_occupancy':        imp(results_before['bed_occupancy_rate'],   results_after['bed_occupancy_rate']),
        'throughput':           imp(results_before['throughput_patients'],  results_after['throughput_patients'], False),
        'resource_utilization': imp(results_before['resource_utilization'],results_after['resource_utilization']),
        'service_coverage':     imp(results_before['service_coverage'],     results_after['service_coverage'], False),
    }

    projections     = compute_projections(after_params, results_after)
    recommendations = generate_recommendations(results_after, projections, after_params)

    return jsonify({
        'hospital_id': hospital_id, 'scenario_name': scenario_name,
        'before': results_before, 'after': results_after,
        'improvements': improvements,
        'kpis_before': kpis_before, 'kpis_after': kpis_after,
        'services_kpis': services_kpis, 'special_cases_kpis': special_cases_kpis,
        'projections': projections, 'recommendations': recommendations,
        'meta': {
            'consultation_range_min': CONSULTATION_MIN_H * 60,
            'consultation_range_max': CONSULTATION_MAX_H * 60,
            'dms_range_jours': {'min': DMS_MIN_H/24, 'max': DMS_MAX_H/24},
            'cas_particuliers_count': len(special_cases_kpis),
            'dms_globale_jours': round(dms_global/24, 1),
        }
    })


@app.route('/service-kpis', methods=['POST'])
def service_kpis():
    data       = request.get_json()
    is_special = data.get('is_special_case', False)
    if not is_special:
        data['dms_heures'] = clamp_dms(data.get('dms_heures', DMS_DEF_H))
    return jsonify(compute_service_kpis(data))


@app.route('/validate-dms', methods=['POST'])
def validate_dms():
    data  = request.get_json()
    dms_h = data.get('dms_heures', 0)
    dms_j = dms_h / 24
    if DMS_MIN_H <= dms_h <= DMS_MAX_H:
        cat, msg = 'standard', f"DMS normale : {round(dms_j,1)} jours"
    elif CAS_SPEC_MIN_H <= dms_h <= CAS_SPEC_MAX_H:
        cat, msg = 'cas_particulier', f"Cas particulier : {round(dms_j,1)} jours (3-6 mois)"
    elif dms_h > CAS_SPEC_MAX_H:
        cat, msg = 'hors_plage', f"DMS hors plage : {round(dms_j,1)} jours"
    else:
        cat, msg = 'hors_plage', f"DMS trop courte : {round(dms_j,1)} jours"
    return jsonify({'dms_heures': dms_h, 'dms_jours': round(dms_j,1),
                    'category': cat, 'message': msg,
                    'is_special_case': cat == 'cas_particulier'})


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':  'ok',
        'service': 'HealthSim DES Engine v6.0 — Erlang-C M/M/c + ML XGBoost',
        'model_A4': {
            'formule':      'A4 = MAX(Wq_médecin, Wq_infirmier, Wq_équipement)',
            'wq_medecin':   'Erlang-C(λ=patients/sim_h, μ=1/consultation, c=médecins_consultation)',
            'wq_infirmier': 'Erlang-C(λ=patients/sim_h, μ=1/soin_inf, c=infirmiers_consultation)',
            'wq_equipement':'MAX[ Erlang-C(λ_eq, μ_eq, c_eq) ] par équipement',
            'sim_hours':    '8h (consultation 7h-15h) ou 24h (service continu)',
            'lambda':       '35 patients/jour (consultations externes)',
        },
        'references': {
            'erlang_c':  'Bhattarai et al. (2025) ESIC Vol.9.1 — M/M/c Model',
            'series':    'Green L.V. (2006) Springer — Queueing analysis healthcare',
            'infirmiers':'Needleman et al. (2002) NEJM 346(22)',
            'equipment': 'Hung et al. (2007) Ann Emerg Med 49(3)',
            'triage':    'WHO (2008) Emergency care systems',
            'dms':       'Stylianou et al. (2017) Health Informatics J.',
            'infection': 'ECDC (2013) Point prevalence survey HAI',
        },
        'ml_model': _PIPELINE.get('nom_modele','Non charge') if _PIPELINE else 'Non charge',
    })


# ============================================================
# PIPELINE ML — XGBoost HealthSim
# ============================================================
import joblib, os, pandas as pd

_ML_PATH  = os.path.join(os.path.dirname(__file__), 'models', 'healthsim_final_pipeline.pkl')
_PIPELINE = None
try:
    _PIPELINE = joblib.load(_ML_PATH)
    print(f"✅ ML : {_PIPELINE.get('nom_modele','?')} | F1={_PIPELINE.get('f1_macro_test',0):.4f}")
except Exception as e:
    print(f"⚠️  ML non chargé : {e}")


def _predire_statut(kpis: dict) -> dict:
    if _PIPELINE is None: return {'error': 'Pipeline ML non chargé'}
    try:
        model=_PIPELINE['modele']; scaler=_PIPELINE['scaler']
        features_all=_PIPELINE['features_all']; label_map=_PIPELINE['label_map']
        winsor_bounds=_PIPELINE['winsor_bounds']; max_attente=_PIPELINE['max_attente']
        d = pd.DataFrame([kpis])
        for col,(lo,hi) in winsor_bounds.items():
            if col in d.columns: d[col]=d[col].clip(lo,hi)
        d['Score_Surcharge']       = d['taux_occupation_lits']*0.40+d['temps_attente_median_min']/max(max_attente,1)*0.30+d['taux_transfert']*0.30
        d['Score_Risque_Clinique'] = d['taux_mortalite']*0.60+d['taux_infection_nosocomiale']*0.40
        d['Score_RH']              = d['ratio_medecin_par_lit']*0.50+d['ratio_infirmier_par_lit']*0.50
        d['Annee_Num']             = int(kpis.get('annee',2026))
        for f in features_all:
            if f not in d.columns: d[f]=0.0
        X = scaler.transform(d[features_all].values)
        pred=model.predict(X)[0]; proba=model.predict_proba(X)[0]; label=label_map[int(pred)]
        recs={0:{'niveau':'🔴 CRITIQUE','action':'Intervention immédiate requise.','details':'Alerter la direction.'},
              1:{'niveau':'🟡 ATTENTION','action':'Surveillance renforcée.','details':'Réviser la planification.'},
              2:{'niveau':'🟢 NORMAL','action':'Continuer le suivi standard.','details':'Maintenir les bonnes pratiques.'}}
        return {'statut':int(pred),'label':label,
                'probabilites':{label_map[i]:round(float(p),4) for i,p in enumerate(proba)},
                'confiance':round(float(proba.max()),4),'recommandation':recs[int(pred)]}
    except Exception as e:
        return {'error': str(e)}


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if 'services' in data:
        return jsonify({'results':[{'service_name':s.get('service_name',''),
                                    'prediction':_predire_statut(dict(s.get('kpis',{})))}
                                   for s in data['services']],
                        'model_loaded': _PIPELINE is not None})
    return jsonify({'service_name': data.get('service_name',''),
                    'prediction':   _predire_statut(dict(data.get('kpis',{}))),
                    'model_loaded': _PIPELINE is not None})


@app.route('/predict/health', methods=['GET'])
def predict_health():
    return jsonify({'model_loaded':  _PIPELINE is not None,
                    'nom_modele':    _PIPELINE.get('nom_modele','') if _PIPELINE else '',
                    'f1_macro_test': _PIPELINE.get('f1_macro_test',0) if _PIPELINE else 0,
                    'features_count':len(_PIPELINE.get('features_all',[])) if _PIPELINE else 0})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)