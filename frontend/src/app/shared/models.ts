export type Id = number;

export interface Hospital {
  id: Id;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  totalBeds: number;
  availableBeds: number;
  doctors: number;
  nurses: number;
  patients: number;
  loadStatus: 'normal' | 'medium' | 'high' | 'critical' | string;
}

export interface Equipment {
  id: Id;
  serviceId?: Id;
  name: string;
  type: string;
  quantity: number;
  status: 'operational' | 'maintenance' | 'offline' | string;
}

export interface Service {
  id: Id;
  hospitalId: Id;
  name: string;
  head?: string;
  doctors: number;
  nurses: number;
  beds: number;
  availableBeds: number;
  patients: number;
  status: 'normal' | 'medium' | 'high' | 'critical' | string;
  equipment: Equipment[];
}

export interface Alert {
  id: Id;
  hospitalId?: Id | null;
  hospitalName?: string;
  serviceId?: Id | null;
  serviceName?: string;
  type?: string;
  severity: 'critical' | 'warning' | 'info' | string;
  description: string;
  resolved?: number | boolean;
  createdAt: string;
}

export interface SummaryStats {
  totalHospitals: number;
  totalDoctors: number;
  totalNurses: number;
  totalPatients: number;
  totalBeds: number;
  availableBeds: number;
  activeAlerts: number;
  criticalServices: number;
  overallLoadStatus: string;
}

export interface DashboardStats {
  hospitalId: Id;
  hospitalName: string;
  doctors: number;
  nurses: number;
  patients: number;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  loadPercentage: number;
  loadStatus: string;
  serviceCount: number;
  activeAlerts: number;
  equipmentStatus: { operational: number; maintenance: number; offline: number };
}

// =============== SIMULATION TYPES (mirrors React) ===============
export interface AllInputs {
  urgences: { beds: number; doctors: number; nurses: number; defibrillators: number; monitors: number; respirators: number };
  chirurgie: { rooms: number; anesthesistes: number; surgeonsGen: number; surgeonsCardio: number; autoclaves: number; tables: number };
  radiologie: { radiologists: number; technicians: number; irm: number; scanners: number; echos: number };
  laboratoire: { biologists: number; technicians: number; biochem: number; centrifuges: number };
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
  waitingTime: number;
  throughput: number;
  bedOccupancy: number;
  staffEfficiency: number;
  improvements: { waiting: number; throughput: number; bed: number; staff: number };
  services: ServiceLoad[];
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
