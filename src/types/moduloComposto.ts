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

export interface ProgressoDetalhado {
  inscricao_id: string;
  funcionario_id: string;
  curso_id: string;
  status_curso: string;
  progresso_percentual: number;
  data_inscricao: string;
  data_conclusao?: string | null;
  
  funcionario_nome: string;
  funcionario_email: string;
  curso_titulo: string;
  
  modulos_progresso: ProgressoModulo[];
  
  // Estatísticas
  total_modulos: number;
  modulos_concluidos: number;
  modulos_obrigatorios: number;
  modulos_obrigatorios_concluidos: number;
}

export interface ProximoModulo {
  modulo_id: string;
  titulo: string;
  ordem: number;
  tipo_conteudo?: string | null;
  tem_avaliacao: boolean;
}
