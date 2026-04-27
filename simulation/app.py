from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import math
import random

app = Flask(__name__)
CORS(app)

# ============================================================
# MOTEUR DES — Simulation à Événements Discrets
# Basé sur le rapport HealthSim (Chapitre 2.5)
# ============================================================

def erlang_c(c, rho):
    if rho >= 1:
        return 1.0
    if c > 100:
        c = 100
    
    a = c * rho
    
    try:
        sum_terms = sum((a**k) / math.factorial(k) for k in range(min(c, 50)))
        last_term = (a**min(c, 50)) / (math.factorial(min(c, 50)) * (1 - rho))
        prob_wait = last_term / (sum_terms + last_term)
    except (OverflowError, ZeroDivisionError):
        prob_wait = rho
    
    return min(prob_wait, 1.0)

def run_des_simulation(params):
    """
    Moteur DES principal
    Simule le flux de patients selon les formules du rapport
    """
    # Paramètres d'entrée
    total_beds = params.get('total_beds', 100)
    total_doctors = params.get('total_doctors', 20)
    total_nurses = params.get('total_nurses', 40)
    total_equipment = params.get('total_equipment', 10)
    active_patients = params.get('active_patients', 80)
    simulation_hours = params.get('simulation_hours', 24)
    
    # ============================================================
    # CALCUL DES PARAMÈTRES DES
    # ============================================================
    
    # λ (taux d'arrivée) = patients / période de simulation
    lambda_rate = active_patients / simulation_hours
    
    # µ (taux de service) = 1 / durée_moyenne_séjour
    # Durée moyenne de séjour estimée à 4h pour urgences
    mu_rate = 1 / 4.0
    
    # c = nombre de ressources (médecins disponibles)
    c_doctors = max(1, total_doctors)
    c_beds = max(1, total_beds)
    
    # ============================================================
    # KPI 1 : Taux d'utilisation des ressources (ρ)
    # ρ = λ / (c × µ)
    # ============================================================
    rho_doctors = lambda_rate / (c_doctors * mu_rate)
    rho_beds = lambda_rate / (c_beds * mu_rate)
    rho_doctors = min(rho_doctors, 0.99)
    rho_beds = min(rho_beds, 0.99)
    
    # ============================================================
    # KPI 2 : Temps d'attente (Wq) — Erlang-C
    # Wq = P(W>0) / (c × µ - λ)
    # ============================================================
    pw_doctors = erlang_c(c_doctors, rho_doctors)
    pw_beds = erlang_c(c_beds, rho_beds)
    
    effective_service_rate_doctors = c_doctors * mu_rate - lambda_rate
    effective_service_rate_beds = c_beds * mu_rate - lambda_rate
    
    wq_doctors = pw_doctors / max(effective_service_rate_doctors, 0.01)
    wq_beds = pw_beds / max(effective_service_rate_beds, 0.01)
    
    # Temps d'attente moyen en minutes
    waiting_time = round((wq_doctors + wq_beds) / 2 * 60, 1)
    
    # ============================================================
    # KPI 3 : Débit de patients
    # Débit = Nombre de patients traités / Période de simulation
    # ============================================================
    throughput = round(active_patients * (1 - rho_beds) + active_patients * 0.7, 1)
    throughput = round(min(throughput, active_patients * 1.2), 1)
    
    # ============================================================
    # KPI 4 : Taux d'occupation des lits
    # Taux = Lits occupés / Lits totaux
    # ============================================================
    occupied_beds = active_patients
    bed_occupancy_rate = round((occupied_beds / max(total_beds, 1)) * 100, 1)
    
    # Durée moyenne de séjour (LOS)
    los = round(active_patients / max(lambda_rate, 0.01) * 0.1, 1)
    
    # Couverture des services
    service_coverage = round(min(100, (total_doctors * 5 + total_nurses * 2) / max(active_patients, 1) * 10), 1)
    
    return {
        'waiting_time_minutes': waiting_time,
        'los_hours': los,
        'throughput_patients': throughput,
        'bed_occupancy_rate': bed_occupancy_rate,
        'resource_utilization': round(rho_doctors * 100, 1),
        'service_coverage': service_coverage,
        'lambda_rate': round(lambda_rate, 3),
        'mu_rate': round(mu_rate, 3),
        'rho_doctors': round(rho_doctors, 3),
        'rho_beds': round(rho_beds, 3),
    }

# ============================================================
# ROUTE PRINCIPALE — POST /simulate
# ============================================================
@app.route('/simulate', methods=['POST'])
def simulate():
    data = request.get_json()
    
    hospital_id = data.get('hospital_id')
    scenario_name = data.get('scenario_name', 'Scénario personnalisé')
    
    # État AVANT (données actuelles)
    before_params = {
        'total_beds': data.get('current_beds', 100),
        'total_doctors': data.get('current_doctors', 20),
        'total_nurses': data.get('current_nurses', 40),
        'total_equipment': data.get('current_equipment', 10),
        'active_patients': data.get('active_patients', 80),
        'simulation_hours': 24,
    }
    
    # État APRÈS (paramètres du scénario)
    after_params = {
        'total_beds': data.get('target_beds', before_params['total_beds']),
        'total_doctors': data.get('target_doctors', before_params['total_doctors']),
        'total_nurses': data.get('target_nurses', before_params['total_nurses']),
        'total_equipment': data.get('target_equipment', before_params['total_equipment']),
        'active_patients': data.get('active_patients', 80),
        'simulation_hours': 24,
    }
    
    # Exécution DES
    results_before = run_des_simulation(before_params)
    results_after = run_des_simulation(after_params)
    
    # Calcul des améliorations en %
    def improvement(before, after, lower_is_better=True):
        if before == 0:
            return 0
        diff = ((before - after) / before * 100) if lower_is_better else ((after - before) / before * 100)
        return round(diff, 1)
    
    improvements = {
        'waiting_time': improvement(results_before['waiting_time_minutes'], results_after['waiting_time_minutes']),
        'bed_occupancy': improvement(results_before['bed_occupancy_rate'], results_after['bed_occupancy_rate']),
        'throughput': improvement(results_before['throughput_patients'], results_after['throughput_patients'], lower_is_better=False),
        'resource_utilization': improvement(results_before['resource_utilization'], results_after['resource_utilization']),
        'service_coverage': improvement(results_before['service_coverage'], results_after['service_coverage'], lower_is_better=False),
    }
    
    return jsonify({
        'hospital_id': hospital_id,
        'scenario_name': scenario_name,
        'before': results_before,
        'after': results_after,
        'improvements': improvements,
        'params_before': before_params,
        'params_after': after_params,
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'HealthSim DES Engine'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)