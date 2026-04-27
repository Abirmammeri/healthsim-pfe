import { AllInputs, EquipmentItem, SimResult } from './models';

export const PRIMARY = '#00BCD4';
export const PRIMARY_DARK = '#0288D1';
export const GREEN = '#43A047';
export const ORANGE = '#FB8C00';
export const RED = '#E53935';

export const DEFAULT_INPUT: AllInputs = {
  urgences: { beds: 150, doctors: 12, nurses: 35, defibrillators: 3, monitors: 15, respirators: 4 },
  chirurgie: { rooms: 8, anesthesistes: 6, surgeonsGen: 4, surgeonsCardio: 2, autoclaves: 2, tables: 8 },
  radiologie: { radiologists: 5, technicians: 9, irm: 1, scanners: 2, echos: 3 },
  laboratoire: { biologists: 3, technicians: 8, biochem: 3, centrifuges: 4 },
};

export const BASE_TOTAL_STAFF =
  DEFAULT_INPUT.urgences.doctors + DEFAULT_INPUT.urgences.nurses +
  DEFAULT_INPUT.chirurgie.anesthesistes + DEFAULT_INPUT.chirurgie.surgeonsGen + DEFAULT_INPUT.chirurgie.surgeonsCardio +
  DEFAULT_INPUT.radiologie.radiologists + DEFAULT_INPUT.radiologie.technicians +
  DEFAULT_INPUT.laboratoire.biologists + DEFAULT_INPUT.laboratoire.technicians;

export type Range = [number, number, number];
export const RANGES: Record<keyof AllInputs, Record<string, { label: string; range: Range; unit?: string }>> = {
  urgences: {
    beds: { label: 'Lits Urgences', range: [100, 200, 5] },
    doctors: { label: 'Médecins Urgences', range: [8, 20, 1] },
    nurses: { label: 'Infirmiers Urgences', range: [25, 50, 1] },
    defibrillators: { label: 'Défibrillateurs', range: [2, 6, 1] },
    monitors: { label: 'Moniteurs cardiaques', range: [10, 25, 1] },
    respirators: { label: 'Respirateurs', range: [3, 8, 1] },
  },
  chirurgie: {
    rooms: { label: 'Salles opératoires', range: [5, 15, 1] },
    anesthesistes: { label: 'Anesthésistes', range: [4, 10, 1] },
    surgeonsGen: { label: 'Chirurgiens généraux', range: [3, 7, 1] },
    surgeonsCardio: { label: 'Chirurgiens cardio', range: [1, 4, 1] },
    autoclaves: { label: 'Autoclaves', range: [1, 3, 1] },
    tables: { label: 'Tables opératoires', range: [5, 12, 1] },
  },
  radiologie: {
    radiologists: { label: 'Radiologues', range: [3, 8, 1] },
    technicians: { label: 'Techniciens', range: [6, 15, 1] },
    irm: { label: 'IRM', range: [0, 2, 1] },
    scanners: { label: 'Scanners', range: [1, 4, 1] },
    echos: { label: 'Échographes', range: [2, 6, 1] },
  },
  laboratoire: {
    biologists: { label: 'Biologistes', range: [2, 6, 1] },
    technicians: { label: 'Techniciens labo', range: [5, 12, 1] },
    biochem: { label: 'Analyseurs biochimie', range: [2, 5, 1] },
    centrifuges: { label: 'Centrifugeuses', range: [3, 7, 1] },
  },
};

export const SIM_BASELINE = { waiting: 2.4, throughput: 17, bed: 88, staff: 70 };

export function statusColor(load: number): string {
  if (load < 60) return GREEN;
  if (load < 80) return ORANGE;
  return RED;
}

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

export function runSimulation(input: AllInputs): SimResult {
  const urgScore = (input.urgences.doctors * 2 + input.urgences.nurses + input.urgences.beds * 0.3 + input.urgences.respirators * 3) / 5;
  const chirScore = (input.chirurgie.rooms * 4 + input.chirurgie.anesthesistes * 3 + input.chirurgie.surgeonsGen * 3 + input.chirurgie.tables * 2) / 5;
  const radScore = (input.radiologie.radiologists * 4 + input.radiologie.technicians * 2 + input.radiologie.scanners * 6 + input.radiologie.irm * 8) / 4;
  const labScore = (input.laboratoire.biologists * 4 + input.laboratoire.technicians * 2 + input.laboratoire.biochem * 5 + input.laboratoire.centrifuges * 3) / 4;

  const urgLoad = clamp(120 - urgScore * 0.7);
  const chirLoad = clamp(110 - chirScore * 0.9);
  const radLoad = clamp(115 - radScore * 0.95);
  const labLoad = clamp(105 - labScore * 0.95);
  const avgLoad = (urgLoad + chirLoad + radLoad + labLoad) / 4;

  const totalStaff =
    input.urgences.doctors + input.urgences.nurses + input.chirurgie.anesthesistes + input.chirurgie.surgeonsGen +
    input.chirurgie.surgeonsCardio + input.radiologie.radiologists + input.radiologie.technicians +
    input.laboratoire.biologists + input.laboratoire.technicians;

  const waitingTime = clamp(4.5 - totalStaff * 0.025, 0.5, 5);
  const throughput = clamp(10 + totalStaff * 0.18 + input.chirurgie.rooms * 0.4, 10, 35);
  const bedOccupancy = clamp(avgLoad);
  const staffEfficiency = clamp(60 + totalStaff * 0.12);

  const improvements = {
    waiting: ((SIM_BASELINE.waiting - waitingTime) / SIM_BASELINE.waiting) * 100,
    throughput: ((throughput - SIM_BASELINE.throughput) / SIM_BASELINE.throughput) * 100,
    bed: ((SIM_BASELINE.bed - bedOccupancy) / SIM_BASELINE.bed) * 100,
    staff: ((staffEfficiency - SIM_BASELINE.staff) / SIM_BASELINE.staff) * 100,
  };

  const equipment: EquipmentItem[] = [
    { service: 'Urgences', name: `Défibrillateurs (${input.urgences.defibrillators})`, usage: clamp(95 - input.urgences.defibrillators * 8),
      status: input.urgences.defibrillators >= 4 ? 'ok' : input.urgences.defibrillators >= 3 ? 'warning' : 'critical',
      action: input.urgences.defibrillators < 4 ? '+1 Défibrillateur' : undefined },
    { service: 'Urgences', name: `Respirateurs (${input.urgences.respirators})`, usage: clamp(90 - input.urgences.respirators * 6),
      status: input.urgences.respirators >= 5 ? 'ok' : input.urgences.respirators >= 4 ? 'warning' : 'critical',
      action: input.urgences.respirators < 5 ? '+1 Respirateur' : undefined },
    { service: 'Chirurgie', name: `Tables opératoires (${input.chirurgie.tables})`, usage: clamp(95 - input.chirurgie.tables * 5),
      status: input.chirurgie.tables >= 9 ? 'ok' : input.chirurgie.tables >= 7 ? 'warning' : 'critical',
      action: input.chirurgie.tables < 9 ? '+1 Table' : undefined },
    { service: 'Chirurgie', name: `Autoclaves (${input.chirurgie.autoclaves})`, usage: clamp(95 - input.chirurgie.autoclaves * 15),
      status: input.chirurgie.autoclaves >= 3 ? 'ok' : input.chirurgie.autoclaves >= 2 ? 'warning' : 'critical' },
    { service: 'Radiologie', name: `Scanners (${input.radiologie.scanners})`, usage: clamp(100 - input.radiologie.scanners * 12),
      status: input.radiologie.scanners >= 3 ? 'ok' : input.radiologie.scanners >= 2 ? 'warning' : 'critical',
      action: input.radiologie.scanners < 3 ? '+1 Scanner Radiologie' : undefined },
    { service: 'Radiologie', name: `IRM (${input.radiologie.irm})`, usage: clamp(100 - input.radiologie.irm * 30),
      status: input.radiologie.irm >= 2 ? 'ok' : input.radiologie.irm >= 1 ? 'warning' : 'critical',
      action: input.radiologie.irm < 1 ? '+1 IRM' : undefined },
    { service: 'Laboratoire', name: `Analyseurs biochimie (${input.laboratoire.biochem})`, usage: clamp(95 - input.laboratoire.biochem * 8),
      status: input.laboratoire.biochem >= 4 ? 'ok' : input.laboratoire.biochem >= 3 ? 'warning' : 'critical',
      action: input.laboratoire.biochem < 4 ? 'Maintenance Analyseur biochimie' : undefined },
  ];

  return {
    waitingTime: +waitingTime.toFixed(1),
    throughput: +throughput.toFixed(0),
    bedOccupancy: +bedOccupancy.toFixed(0),
    staffEfficiency: +staffEfficiency.toFixed(0),
    improvements,
    services: [
      { name: 'Urgences', load: +urgLoad.toFixed(0), iconName: 'Heart' },
      { name: 'Chirurgie', load: +chirLoad.toFixed(0), iconName: 'Scissors' },
      { name: 'Radiologie', load: +radLoad.toFixed(0), iconName: 'Activity' },
      { name: 'Laboratoire', load: +labLoad.toFixed(0), iconName: 'FlaskConical' },
    ],
    equipment,
  };
}
