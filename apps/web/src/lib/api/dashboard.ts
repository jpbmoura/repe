import { api } from '../api';

export type PersonalDashboard = {
  ativos: number;
  hojeEsperados: number;
  prsSemana: number;
};

export const dashboardApi = {
  personal: () => api.get<PersonalDashboard>('/api/personal/dashboard'),
};

export const dashboardKeys = {
  personal: () => ['dashboard', 'personal'] as const,
};
