export const openapiSpec = {
  openapi: '3.0.3',
  info: { title: 'Progress Service API', version: '1.1.0' },
  paths: {
    '/progress/v1/inscricoes': {
      post: {
        summary: 'Criar inscrição',
        tags: ['progress'],
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
          '409': { description: 'Funcionário já inscrito', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/progress/v1/inscricoes/{id}': {
      get: {
        summary: 'Obter inscrição',
        tags: ['progress'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Encontrada',
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
            '404': { description: 'Não encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/progress/v1/inscricoes/usuario/{userId}': {
      get: {
        summary: 'Listar inscrições do usuário (agregado)',
        tags: ['progress'],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Lista agregada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['items'],
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Inscricao' } },
                    cursos_em_andamento: { type: 'array', items: { $ref: '#/components/schemas/Inscricao' } },
                    cursos_concluidos: { type: 'array', items: { $ref: '#/components/schemas/Inscricao' } },
                    total_em_andamento: { type: 'integer' },
                    total_concluidos: { type: 'integer' },
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
        tags: ['progress'],
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
    '/progress/v1/inscricoes/{id}/modulos/{moduloId}/concluir': {
      post: {
        summary: 'Concluir módulo',
        tags: ['progress'],
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
        tags: ['certificates'],
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
        tags: ['certificates'],
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
        tags: ['certificates'],
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
        tags: ['certificates'],
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