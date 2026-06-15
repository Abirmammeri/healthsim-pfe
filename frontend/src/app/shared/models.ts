export type Id = number;

// ═══════════════════════════════════════════════════════
// HOSPITAL
// ═══════════════════════════════════════════════════════
export interface Hospital {
  id: Id;
  name: string;
  code?: string;
  typeHopital?: string;
  wilaya?: string;
  commune?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  // Colonnes réelles BDD
  total_beds?: number;
  available_beds?: number;
  total_doctors?: number;
  total_nurses?: number;
  active_patients?: number;
  load_status?: string;
  // Aliases pour compatibilité frontend
  capacity: number;
  totalBeds: number;
  availableBeds: number;
  doctors: number;
  nurses: number;
  patients: number;
  loadStatus: 'normal' | 'medium' | 'high' | 'critical' | string;
  status?: string;
  budgetAnnuel?: number;
  scoreLocalisation?: number;
  scoreAirInterieur?: number;
  scoreAcoustique?: number;
}

// ═══════════════════════════════════════════════════════
// EQUIPMENT
// ═══════════════════════════════════════════════════════
export interface Equipment {
  id: Id;
  serviceId?: Id;
  name: string;
  type: string;
  quantity: number;
  status: 'operational' | 'maintenance' | 'broken' | 'offline' | string;
  reference?: string;
  marque?: string;
  modele?: string;
  dateAcquisition?: string;
  coutMaintenanceAnnuel?: number;
  valeurAchat?: number;
}

// ═══════════════════════════════════════════════════════
// KPIs PAR CATÉGORIE
// Référence : Burlea-Schiopoiu & Ferhati, Healthcare MDPI, 2021
// ═══════════════════════════════════════════════════════

// SSI — Indicateurs Sociaux
export interface KpiSSI {
  A2_dms:            number;  // Durée Moyenne de Séjour (jours)
  A4_temps_attente:  number;  // Temps d'attente (minutes) — Erlang-C
  A8_lits_vacants:   number;  // Taux lits vacants (%)
  A9_taux_transfert: number;  // Taux de transfert (%)
}

// IIP — Indicateurs Processus Internes
export interface KpiIIP {
  C2_occupation: number;  // Occupation des lits (%)
  C3_mortalite:  number;  // Taux de mortalité (%)
  C4_infection:  number;  // Taux infection nosocomiale (%)
}

// ESI — Indicateurs Économiques
export interface KpiESI {
  B1_cout_soins:     number;  // Coût moyen des soins (DA/patient)
  B4_cout_lit:       number;  // Coût par lit par jour (DA)
  B5_cout_med_eq:    number;  // Coût médicaments+équipements (DA/mois)
  B7_cout_personnel: number;  // Masse salariale (DA/mois)
}

// TI — Indicateurs Techniques
export interface KpiTI {
  D5_distribution_eq:  number;  // Distribution équipements (score 0-100)
  D11_gestion_dechets: number;  // Gestion déchets (score 0-100)
  D12_localisation:    number;  // Localisation (score 0-100)
  D13_air_interieur:   number;  // Qualité air intérieur (score 0-100)
  D14_acoustique:      number;  // Isolation acoustique (score 0-100)
}

// DES — Paramètres moteur
export interface KpiDES {
  lambda_rate: number;  // λ taux d'arrivée (patients/h)
  mu_rate:     number;  // µ taux de service (patients/h/médecin)
  rho_doctors: number;  // ρ médecins (taux utilisation)
  rho_beds:    number;  // ρ lits (taux utilisation)
  erlang_pw:   number;  // P(W>0) probabilité d'attente
  wq_hours:    number;  // Wq temps attente file (heures)
}

// Structure complète KPIs
export interface ServiceKpis {
  SSI:    KpiSSI;
  IIP:    KpiIIP;
  ESI:    KpiESI;
  TI:     KpiTI;
  DES:    KpiDES;
  statut: 'normal' | 'attention' | 'critique' | string;
}

// ═══════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════
export interface Service {
  id: Id;
  hospitalId: Id;
  name: string;
  code?: string;
  type?: string;
  head?: string;
  doctors: number;
  nurses: number;
  beds: number;
  availableBeds: number;
  patients: number;
  status: 'normal' | 'medium' | 'high' | 'critical' | string;
  dmsHeures?: number;
  lambda_patients_jour?: number;
  equipment: Equipment[];
  // KPIs calculés par Laravel
  kpis?: ServiceKpis;
  // Équipements depuis service_equipments (DB)
  equipmentList?: any[];
}

// ═══════════════════════════════════════════════════════
// ALERT
// ═══════════════════════════════════════════════════════
export interface Alert {
  id: Id;
  hospitalId?: Id | null;
  hospitalName?: string;
  serviceId?: Id | null;
  serviceName?: string;
  title?: string;
  message?: string;
  type?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'warning' | 'info' | string;
  description?: string;
  is_read?: boolean;
  resolved?: number | boolean;
  createdAt?: string;
  created_at?: string;
}

// ═══════════════════════════════════════════════════════
// SUMMARY & DASHBOARD
// ═══════════════════════════════════════════════════════
export interface SummaryStats {
  totalHospitals:    number;
  totalDoctors:      number;
  totalNurses:       number;
  totalPatients:     number;
  totalBeds:         number;
  availableBeds:     number;
  activeAlerts:      number;
  criticalServices:  number;
  overallLoadStatus: string;
}

export interface DashboardStats {
  hospitalId:    Id;
  hospitalName:  string;
  typeHopital?:  string;
  wilaya?:       string;
  doctors:       number;
  nurses:        number;
  patients:      number;
  totalBeds:     number;
  availableBeds: number;
  occupiedBeds:  number;
  loadPercentage:number;
  loadStatus:    string;
  serviceCount:  number;
  activeAlerts:  number;
  equipmentStatus: {
    operational: number;
    maintenance: number;
    offline:     number;
  };
  // KPIs globaux par catégorie
  kpis?: {
    SSI: KpiSSI;
    IIP: KpiIIP;
    ESI: KpiESI;
    TI:  KpiTI;
  };
  // KPIs par service
  servicesKpis?: {
    service: { id: Id; name: string; status: string };
    kpis:    ServiceKpis;
  }[];
}

// ═══════════════════════════════════════════════════════
// SIMULATION
// ═══════════════════════════════════════════════════════

// Résultats DES de base
export interface SimKpiResult {
  waiting_time_minutes: number;
  bed_occupancy_rate:   number;
  throughput_patients:  number;
  resource_utilization: number;
  service_coverage:     number;
  lambda_rate:          number;
  mu_rate:              number;
  rho_doctors:          number;
  rho_beds:             number;
}

// Projection temporelle
export interface TimeProjection {
  month:                number;
  label:                string;
  status:               'normal' | 'warning' | 'critical' | string;
  waiting_time:         number;
  bed_occupancy:        number;
  resource_utilization: number;
  service_coverage:     number;
  rho_doctors:          number;
  rho_beds:             number;
  // KPIs projetés par catégorie
  kpis?: {
    SSI: KpiSSI;
    IIP: KpiIIP;
    ESI: KpiESI;
    TI:  KpiTI;
  };
  factors: {
    active_patients:       number;
    effective_doctors:     number;
    effective_nurses:      number;
    effective_equipment:   number;
    patient_growth_pct:    number;
    equipment_failure_pct: number;
    staff_turnover_pct:    number;
  };
}

// Recommandation
export interface Recommendation {
  priority:     'high' | 'medium' | 'low' | string;
  type:         string;
  icon:         string;
  title:        string;
  description:  string;
  action:       string;
  impact:       string;
  triggerMonth: number | null;
}

// KPIs par service dans simulation
export interface SimulationServiceKpi {
  service_id:   number;
  service_name: string;
  doctors:      number;
  nurses:       number;
  beds:         number;
  patients:     number;
  dms_heures:   number;
  statut:       string;
  kpis:         ServiceKpis;
}

// Résultat complet simulation
export interface SimulationResult {
  hospital_id:    number;
  scenario_name:  string;
  // Résultats DES
  before:         SimKpiResult;
  after:          SimKpiResult;
  improvements:   Record<string, number>;
  // KPIs enrichis par catégorie
  kpis_before?: {
    SSI: KpiSSI; IIP: KpiIIP; ESI: KpiESI; TI: KpiTI;
  };
  kpis_after?: {
    SSI: KpiSSI; IIP: KpiIIP; ESI: KpiESI; TI: KpiTI;
  };
  // KPIs par service
  services_kpis?: SimulationServiceKpi[];
  // Projections et recommandations
  projections:     TimeProjection[];
  recommendations: Recommendation[];
}

// Historique simulation sauvegardée
export interface SimulationRecord {
  id:           number;
  hospitalId:   number;
  scenarioName: string;
  description?: string;
  statut:       'brouillon' | 'applique' | 'archive' | string;
  createdAt:    string;
  appliedAt?:   string;
  createdBy?:   string;
  input?: {
    active_patients:  number;
    target_doctors:   number;
    target_nurses:    number;
    target_beds:      number;
    available_eq:     number;
    current_doctors:  number;
    current_nurses:   number;
    current_beds:     number;
    current_eq:       number;
  };
  before?:          SimKpiResult;
  after?:           SimKpiResult;
  improvements?:    Record<string, number>;
  projections?:     TimeProjection[];
  recommendations?: Recommendation[];
  scenarioChanges?: any;
}

// ═══════════════════════════════════════════════════════
// ANCIENS TYPES (compatibilité)
// ═══════════════════════════════════════════════════════
export interface AllInputs {
  urgences: {
    beds: number; doctors: number; nurses: number;
    defibrillators: number; monitors: number; respirators: number;
  };
  chirurgie: {
    rooms: number; anesthesistes: number; surgeonsGen: number;
    surgeonsCardio: number; autoclaves: number; tables: number;
  };
  radiologie: {
    radiologists: number; technicians: number;
    irm: number; scanners: number; echos: number;
  };
  laboratoire: {
    biologists: number; technicians: number;
    biochem: number; centrifuges: number;
  };
}

export type ServiceKey = keyof AllInputs;

export interface ServiceLoad {
  name: string;
  load: number;
  iconName: string;
}

export interface EquipmentItem {
  service: string;
  name: string;
  usage: number;
  status: 'ok' | 'warning' | 'critical';
  action?: string;
}

export interface SimResult {
  waitingTime:     number;
  throughput:      number;
  bedOccupancy:    number;
  staffEfficiency: number;
  improvements: {
    waiting: number; throughput: number;
    bed: number; staff: number;
  };
  services:  ServiceLoad[];
  equipment: EquipmentItem[];
}

export interface ScenarioEquipment {
  id: string;
  name: string;
  type: string;
  quantity: number;
  status: 'operational' | 'maintenance';
}

export type ScenarioEquipmentMap = Record<ServiceKey, ScenarioEquipment[]>;