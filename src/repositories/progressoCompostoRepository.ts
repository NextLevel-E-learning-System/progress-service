import { withClient } from '../db.js';

export async function listarModulosComProgresso(
  inscricaoId: string
): Promise<Array<{
  modulo_id: string;
  titulo: string;
  ordem: number;
  tipo_conteudo: string;
  obrigatorio: boolean;
  xp_modulo: number;
  concluido: boolean;
  liberado: boolean;
  data_inicio?: string;
  data_conclusao?: string;
  tempo_gasto?: number;
  tem_avaliacao: boolean;
  total_materiais: number;
}>> {
  return withClient(async (client) => {
    const result = await client.query(
      `
      SELECT 
        m.id as modulo_id,
        m.titulo,
        m.ordem,
        m.tipo_conteudo,
        m.obrigatorio,
        m.xp_modulo,
        
        -- Status de conclusão e início
        CASE WHEN pm.data_conclusao IS NOT NULL THEN true ELSE false END as concluido,
        pm.data_inicio,
        pm.data_conclusao,
        
        -- Tempo gasto (em minutos)
        pm.tempo_gasto,
        
        -- Verificar se está liberado
        progress_service.modulo_esta_liberado($1, m.id) as liberado,
        
        -- Metadados
        CASE WHEN av.codigo IS NOT NULL THEN true ELSE false END as tem_avaliacao,
        COUNT(DISTINCT mat.id) as total_materiais
        
      FROM progress_service.inscricoes i
      INNER JOIN course_service.modulos m ON m.curso_id = i.curso_id
      LEFT JOIN progress_service.progresso_modulos pm 
        ON pm.inscricao_id = i.id AND pm.modulo_id = m.id
      LEFT JOIN assessment_service.avaliacoes av 
        ON av.modulo_id = m.id AND av.ativo = true
      LEFT JOIN course_service.materiais mat ON mat.modulo_id = m.id
      
      WHERE i.id = $1
      
      GROUP BY 
        m.id, m.titulo, m.ordem, m.tipo_conteudo, m.obrigatorio, m.xp_modulo,
        pm.data_inicio, pm.data_conclusao, pm.tempo_gasto, av.codigo
      
      ORDER BY m.ordem ASC
      `,
      [inscricaoId]
    );
    
    return result.rows;
  });
}
