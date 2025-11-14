// Tipos do Monjaro UP

export interface User {
  id: string;
  email: string;
  nome: string;
  idade?: number;
  sexo?: string;
  peso_atual?: number;
  meta_proteina: number;
  meta_fibra: number;
  meta_agua: number;
  
  // Campos da Anamnese
  objetivo_principal?: string;
  nivel_apetite?: string;
  freq_proteina?: string;
  freq_fibra?: string;
  nivel_energia?: string;
  sentiu_enjoo?: string;
  bebe_agua?: string;
  atividade_fisica?: string;
  dificuldades?: string[];
  pref_notificacoes?: string;
  ja_comecou_tratamento?: string;
  anamnese_concluida: boolean;
  
  data_criacao: string;
}

export interface Dose {
  id: string;
  user_id: string;
  dose_mg: number;
  data_aplicacao: string;
  observacoes?: string;
  created_at: string;
}

export interface Nutricao {
  id: string;
  user_id: string;
  data: string;
  proteina_g: number;
  fibra_g: number;
  agua_ml: number;
  calorias?: number;
  atividade_min: number;
  created_at: string;
}

export interface Sintoma {
  id: string;
  user_id: string;
  data: string;
  enjoo: number;
  dor_abdominal: number;
  fraqueza: number;
  constipacao: number;
  diarreia: number;
  refluxo: number;
  tontura: number;
  dor_cabeca: number;
  falta_apetite: number;
  observacoes?: string;
  created_at: string;
}

export interface Peso {
  id: string;
  user_id: string;
  data: string;
  peso_kg: number;
  circunferencia_abdomen?: number;
  created_at: string;
}

export interface AnamneseData {
  objetivo_principal: string;
  nivel_apetite: string;
  freq_proteina: string;
  freq_fibra: string;
  nivel_energia: string;
  sentiu_enjoo: string;
  bebe_agua: string;
  atividade_fisica: string;
  dificuldades: string[];
  pref_notificacoes: string;
  peso_atual: number;
  ja_comecou_tratamento: string;
}

export const DOSES_MONJARO = [2.5, 5, 7.5, 10, 12.5, 15] as const;
export type DoseMonjaro = typeof DOSES_MONJARO[number];
