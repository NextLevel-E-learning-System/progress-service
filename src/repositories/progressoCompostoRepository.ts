import { withClient } from '../db.js';
import { ProgressoDetalhado, ProximoModulo } from '../types/moduloComposto.js';

/**
 * Busca progresso detalhado de uma inscrição
 * Usa a view v_progresso_detalhado
 */
export async function getProgressoDetalhado(inscricaoId: string): Promise<ProgressoDetalhado | null> {
  return withClient(async (client) => {
    const result = await client.query<ProgressoDetalhado>(
      `SELECT * FROM progress_service.v_progresso_detalhado WHERE inscricao_id = $1`,
      [inscricaoId]
    );
    
    return result.rows[0] || null;
  });
}

/**
 * Retorna o próximo módulo não concluído
 * Usa a function get_proximo_modulo
 */
export async function getProximoModulo(inscricaoId: string): Promise<ProximoModulo | null> {
  return withClient(async (client) => {
    const result = await client.query<ProximoModulo>(
      `SELECT * FROM progress_service.get_proximo_modulo($1)`,
      [inscricaoId]
    );
    
    return result.rows[0] || null;
  });
}

/**
 * Verifica se um módulo está liberado para o aluno
 * Usa a function modulo_esta_liberado
 */
export async function verificarModuloLiberado(
  inscricaoId: string,
  moduloId: string
): Promise<boolean> {
  return withClient(async (client) => {
    const result = await client.query<{ modulo_esta_liberado: boolean }>(
      `SELECT progress_service.modulo_esta_liberado($1, $2) as modulo_esta_liberado`,
      [inscricaoId, moduloId]
    );
    
    return result.rows[0]?.modulo_esta_liberado ?? false;
  });
}

/**
 * Marca que o aluno iniciou/está visualizando um módulo
 * Usa a function marcar_conteudo_visualizado
 */
export async function marcarConteudoVisualizado(
  inscricaoId: string,
  moduloId: string,
  tipoConteudo?: string
): Promise<void> {
  return withClient(async (client) => {
    await client.query(
      `SELECT progress_service.marcar_conteudo_visualizado($1, $2, $3)`,
      [inscricaoId, moduloId, tipoConteudo || null]
    );
  });
}

/**
 * Marcar módulo como concluído
 * Atualiza data_conclusao no progresso_modulos
 */
export async function marcarModuloConcluido(
  inscricaoId: string,
  moduloId: string,
  tempoGasto?: number
): Promise<void> {
  return withClient(async (client) => {
    await client.query(
      `
      UPDATE progress_service.progresso_modulos
      SET 
        data_conclusao = NOW(),
        tempo_gasto = COALESCE($3, tempo_gasto),
        atualizado_em = NOW()
      WHERE inscricao_id = $1 AND modulo_id = $2
      `,
      [inscricaoId, moduloId, tempoGasto || null]
    );
    
    // Recalcular progresso da inscrição
    await recalcularProgressoInscricao(inscricaoId);
  });
}

/**
 * Recalcula o progresso percentual da inscrição
 */
async function recalcularProgressoInscricao(inscricaoId: string): Promise<void> {
  return withClient(async (client) => {
    await client.query(
      `
      WITH stats AS (
        SELECT 
          COUNT(DISTINCT m.id) FILTER (WHERE m.obrigatorio = true) as total_obrigatorios,
          COUNT(DISTINCT pm.modulo_id) FILTER (
            WHERE pm.data_conclusao IS NOT NULL AND m.obrigatorio = true
          ) as obrigatorios_concluidos
        FROM progress_service.inscricoes i
        INNER JOIN course_service.modulos m ON m.curso_id = i.curso_id
        LEFT JOIN progress_service.progresso_modulos pm 
          ON pm.inscricao_id = i.id AND pm.modulo_id = m.id
        WHERE i.id = $1
      )
      UPDATE progress_service.inscricoes
      SET 
        progresso_percentual = CASE 
          WHEN (SELECT total_obrigatorios FROM stats) = 0 THEN 100
          ELSE ROUND((SELECT obrigatorios_concluidos::numeric / total_obrigatorios * 100 FROM stats))
        END,
        status = CASE
          WHEN (SELECT obrigatorios_concluidos FROM stats) = (SELECT total_obrigatorios FROM stats) 
            AND (SELECT total_obrigatorios FROM stats) > 0
          THEN 'CONCLUIDO'
          ELSE status
        END,
        data_conclusao = CASE
          WHEN (SELECT obrigatorios_concluidos FROM stats) = (SELECT total_obrigatorios FROM stats)
            AND (SELECT total_obrigatorios FROM stats) > 0
            AND data_conclusao IS NULL
          THEN NOW()
          ELSE data_conclusao
        END,
        atualizado_em = NOW()
      WHERE id = $1
      `,
      [inscricaoId]
    );
  });
}

/**
 * Lista todos os módulos do curso com status de conclusão para o aluno
 */
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
  data_conclusao?: string;
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
        
        -- Status de conclusão
        CASE WHEN pm.data_conclusao IS NOT NULL THEN true ELSE false END as concluido,
        pm.data_conclusao,
        
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
        pm.data_conclusao, av.codigo
      
      ORDER BY m.ordem ASC
      `,
      [inscricaoId]
    );
    
    return result.rows;
  });
}
