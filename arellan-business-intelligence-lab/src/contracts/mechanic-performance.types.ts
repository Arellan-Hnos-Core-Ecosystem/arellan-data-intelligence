export interface MechanicCycleTimeEntry {
  mechanicId: string;
  mechanicName: string;
  ordersCompleted: number;
  avgCycleTimeHours: number;
}

export interface MechanicCycleTimeReport {
  mechanics: MechanicCycleTimeEntry[];
  overallAvgCycleTimeHours: number;
}
