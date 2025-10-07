export const openapiSpec = {
  openapi: '3.0.3',
  info: { 
    title: 'Progress Service API', 
    version: '1.4.0',
    description: 'Serviço de progresso de aprendizagem e inscrições.\n\nChangelog 1.4.0: Simplificado endpoint de listagem - removido endpoint individual, mantido apenas listagem por usuário.\nChangelog 1.3.0: Adicionados endpoints para iniciar/concluir módulos e validação de pré-requisitos.\nChangelog 1.2.0: Adicionada prevenção de inscrições duplicadas e resposta 409 detalhada com a inscrição já existente.'
  },
  tags: [
    {
      name: 'Progress - Inscrições',
      description: 'Gestão de Inscrições - Inscrições de usuários em cursos'
    },
    {
      name: 'Progress - Progresso',
      description: 'Acompanhamento de Progresso - Progresso em módulos e atividades'
    },
    {
      name: 'Progress - Certificados',
      description: 'Gestão de Certificados - Certificados de conclusão'
    }
  ],
  paths: {
    '/progress/v1/inscricoes': {
      post: {
        summary: 'Criar inscrição',
        tags: ['Progress - Inscrições'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['funcionario_id', 'curso_id'],
                properties: {
                  funcionario_id: { type: 'string', format: 'uuid' },
                  curso_id: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Criada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    inscricao: { $ref: '#/components/schemas/Inscricao' },
                    mensagem: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Curso ou funcionário não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { 
            description: 'Usuário já possui inscrição ativa neste curso', 
            content: { 
              'application/json': { 
                schema: { $ref: '#/components/schemas/DuplicateEnrollmentResponse' } 
              } 
            } 
          },
          '422': { 
            description: 'Pré-requisitos não atendidos', 
            content: { 
              'application/json': { 
                schema: { $ref: '#/components/schemas/PrerequisiteErrorResponse' } 
              } 
            } 
          }
        }
      }
    },
    '/progress/v1/inscricoes/usuario/{userId}': {
      get: {
        summary: 'Listar todas as inscrições do usuário',
        tags: ['Progress - Inscrições'],
        description: 'Retorna todas as inscrições do usuário. A filtragem por status deve ser feita no frontend.',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Lista de inscrições',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['items', 'total'],
                  properties: {
                    items: { 
                      type: 'array', 
                      items: { $ref: '#/components/schemas/Inscricao' },
                      description: 'Lista completa de inscrições do usuário'
                    },
                    total: { 
                      type: 'integer',
                      description: 'Total de inscrições' 
                    },
                    mensagem: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/progress/v1/inscricoes/{id}/progresso': {
      patch: {
        summary: 'Atualizar progresso',
        tags: ['Progress - Progresso'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['progresso_percentual'],
                properties: {
                  progresso_percentual: { type: 'integer', minimum: 0, maximum: 100 }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Atualizado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    inscricao: { $ref: '#/components/schemas/Inscricao' },
                    mensagem: { type: 'string' }
                  }
                }
              }
            }
          },
          '404': { description: 'Inscrição não encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/progress/v1/inscricoes/{inscricaoId}/modulos/{moduloId}/iniciar': {
      post: {
        summary: 'Iniciar módulo',
        tags: ['Progress - Progresso'],
        parameters: [
          { name: 'inscricaoId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'moduloId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '201': {
            description: 'Módulo iniciado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    progresso_modulo: { $ref: '#/components/schemas/ProgressoModulo' },
                    mensagem: { type: 'string' }
                  }
                }
              }
            }
          },
          '404': { description: 'Inscrição não encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { description: 'Inscrição inativa ou módulo já iniciado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/progress/v1/inscricoes/{inscricaoId}/modulos/{moduloId}/concluir': {
      patch: {
        summary: 'Concluir módulo (novo)',
        tags: ['Progress - Progresso'],
        parameters: [
          { name: 'inscricaoId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'moduloId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Módulo concluído',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resultado: { $ref: '#/components/schemas/ModuleCompletionResultNew' },
                    mensagem: { type: 'string' }
                  }
                }
              }
            }
          },
          '404': { description: 'Progresso não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { description: 'Módulo já concluído', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/progress/v1/inscricoes/{id}/modulos/{moduloId}/concluir': {
      post: {
        summary: 'Concluir módulo (compatibilidade)',
        tags: ['Progress - Progresso'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'moduloId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '201': {
            description: 'Módulo concluído',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resultado: { $ref: '#/components/schemas/ModuleCompletionResult' },
                    mensagem: { type: 'string' }
                  }
                }
              }
            }
          },
          '404': { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/progress/v1/certificates/user/{userId}': {
      get: {
        summary: 'Certificados do usuário',
        tags: ['Progress - Certificados'],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Lista',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['items'],
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Certificate' } },
                    mensagem: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/progress/v1/certificates/enrollment/{enrollmentId}': {
      post: {
        summary: 'Emitir/Recuperar certificado',
        tags: ['Progress - Certificados'],
        parameters: [
          { name: 'enrollmentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '201': {
            description: 'Emitido/retornado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['certificado'],
                  properties: {
                    certificado: { $ref: '#/components/schemas/Certificate' },
                    mensagem: { type: 'string' }
                  }
                }
              }
            }
          },
          '409': { description: 'Curso não concluído', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Inscrição não encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/progress/v1/certificates/enrollment/{enrollmentId}/pdf': {
      get: {
        summary: 'Obter PDF certificado',
        tags: ['Progress - Certificados'],
        parameters: [
          { name: 'enrollmentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'URL retornada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['downloadUrl', 'codigo'],
                  properties: {
                    downloadUrl: { type: 'string' },
                    key: { type: 'string' },
                    codigo: { type: 'string' },
                    mensagem: { type: 'string' }
                  }
                }
              }
            }
          },
          '404': { description: 'Certificado não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/progress/v1/certificates/validate/{code}': {
      get: {
        summary: 'Validar certificado',
        tags: ['Progress - Certificados'],
        parameters: [
          { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'hash', in: 'query', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Resultado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    certificado: {
                      type: 'object',
                      required: ['codigo', 'valido'],
                      properties: {
                        codigo: { type: 'string' },
                        curso_id: { type: 'string' },
                        funcionario_id: { type: 'string' },
                        data_emissao: { type: 'string', format: 'date-time' },
                        valido: { type: 'boolean' }
                      }
                    },
                    mensagem: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': { description: 'Parâmetros ausentes', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/progress/v1/tracks': {
      get: {
        summary: 'Listar trilhas',
        tags: ['tracks'],
        responses: { '200': { description: 'Lista' } }
      }
    },
    '/progress/v1/tracks/user/{userId}': {
      get: {
        summary: 'Progresso em trilhas',
        tags: ['tracks'],
        parameters: [ { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } } ],
        responses: { '200': { description: 'Progresso retornado' } }
      }
    }
  },
  components: {
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['erro', 'mensagem'],
        properties: { erro: { type: 'string' }, mensagem: { type: 'string' } }
      },
      DuplicateEnrollmentResponse: {
        type: 'object',
        required: ['erro','mensagem','inscricao'],
        properties: {
          erro: { type: 'string', example: 'inscricao_duplicada' },
          mensagem: { type: 'string', example: 'Usuário já possui inscrição ativa neste curso' },
          inscricao: { $ref: '#/components/schemas/Inscricao' }
        }
      },
      PrerequisiteErrorResponse: {
        type: 'object',
        required: ['erro','mensagem','pendentes'],
        properties: {
          erro: { type: 'string', example: 'pre_requisitos_nao_atendidos' },
          mensagem: { type: 'string', example: 'Pré-requisitos do curso não foram atendidos' },
          pendentes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                codigo: { type: 'string' },
                titulo: { type: 'string' }
              }
            }
          }
        }
      },
      ProgressoModulo: {
        type: 'object',
        required: ['id','inscricao_id','modulo_id','data_inicio'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          inscricao_id: { type: 'string', format: 'uuid' },
          modulo_id: { type: 'string', format: 'uuid' },
          data_inicio: { type: 'string', format: 'date-time' },
          data_conclusao: { type: 'string', format: 'date-time', nullable: true },
          tempo_gasto: { type: 'integer', nullable: true },
          criado_em: { type: 'string', format: 'date-time' },
          atualizado_em: { type: 'string', format: 'date-time' }
        }
      },
      ModuleCompletionResultNew: {
        type: 'object',
        required: ['inscricao_id','modulo_id','progresso_percentual','curso_concluido'],
        properties: {
          inscricao_id: { type: 'string', format: 'uuid' },
          modulo_id: { type: 'string', format: 'uuid' },
          progresso_percentual: { type: 'integer' },
          curso_concluido: { type: 'boolean' },
          funcionario_id: { type: 'string', format: 'uuid' },
          curso_id: { type: 'string' }
        }
      },
      Inscricao: {
        type: 'object',
        required: ['id','funcionario_id','curso_id','status','progresso_percentual','data_inscricao'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          funcionario_id: { type: 'string', format: 'uuid' },
          curso_id: { type: 'string' },
          status: { type: 'string', enum: ['EM_ANDAMENTO','CONCLUIDO','CANCELADO'] },
          progresso_percentual: { type: 'integer', minimum: 0, maximum: 100 },
          data_inscricao: { type: 'string', format: 'date-time' },
          data_inicio: { type: 'string', format: 'date-time', nullable: true },
          data_conclusao: { type: 'string', format: 'date-time', nullable: true },
          criado_em: { type: 'string', format: 'date-time', nullable: true },
          atualizado_em: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      ModuleCompletionResult: {
        type: 'object',
        required: ['inscricao_id','modulo_id','progresso_percentual','concluido'],
        properties: {
          inscricao_id: { type: 'string', format: 'uuid' },
          modulo_id: { type: 'string', format: 'uuid' },
          progresso_percentual: { type: 'integer' },
          concluido: { type: 'boolean' },
          data_conclusao: { type: 'string', format: 'date-time', nullable: true },
          funcionario_id: { type: 'string', format: 'uuid', nullable: true },
          curso_id: { type: 'string', nullable: true }
        }
      },
      Certificate: {
        type: 'object',
        required: ['id','codigo_certificado','hash_validacao','funcionario_id','curso_id','data_emissao'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          codigo_certificado: { type: 'string' },
          hash_validacao: { type: 'string' },
          funcionario_id: { type: 'string', format: 'uuid' },
          curso_id: { type: 'string' },
          data_emissao: { type: 'string', format: 'date-time' },
          storage_key: { type: 'string', nullable: true },
          url_pdf: { type: 'string', nullable: true }
        }
      }
    }
  }
} as const;
