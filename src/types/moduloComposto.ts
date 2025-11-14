// Tipos compartilhados para módulos compostos

export interface MaterialModulo {
  id: string;
  nome_arquivo: string;
  tipo_arquivo: string;
  tamanho: number;
  storage_key: string;
  criado_em: string;
}

export interface AvaliacaoModulo {
  codigo: string;
  titulo: string;
  tempo_limite?: number;
  tentativas_permitidas?: number;
  nota_minima?: number;
  ativo: boolean;
}

export interface ProgressoModulo {
  modulo_id: string;
  modulo_titulo: string;
  modulo_ordem: number;
  modulo_obrigatorio: boolean;
  data_inicio?: string | null;
  data_conclusao?: string | null;
  tempo_gasto?: number | null;
  concluido: boolean;
}
