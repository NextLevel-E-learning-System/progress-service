export const openapiSpec = {
  "openapi": "3.0.3",
  "info": { "title": "Progress Service API", "version": "1.0.0" },
  "paths": {
    "/progress/v1/inscricoes": { 
      "post": { 
        "summary": "Criar inscrição", 
        "description": "Cria uma nova inscrição para um curso. O ID é gerado automaticamente.", 
        "tags": ["progress"], 
        "requestBody": { 
          "required": true, 
          "content": { 
            "application/json": { 
              "schema": { 
                "type": "object", 
                "required": ["funcionario_id", "curso_id"], 
                "properties": { 
                  "funcionario_id": { "type": "string", "format": "uuid", "description": "ID do funcionário" }, 
                  "curso_id": { "type": "string", "description": "Código do curso" } 
                } 
              } 
            } 
          } 
        }, 
        "responses": { 
          "201": { 
            "description": "Inscrição criada com sucesso",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": { "type": "string", "format": "uuid" },
                    "funcionario_id": { "type": "string", "format": "uuid" },
                    "curso_id": { "type": "string" },
                    "data_inscricao": { "type": "string", "format": "date-time" },
                    "status": { "type": "string", "enum": ["EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"] },
                    "progresso_percentual": { "type": "integer", "minimum": 0, "maximum": 100 }
                  }
                }
              }
            }
          },
          "409": { "description": "Funcionário já inscrito no curso" },
          "404": { "description": "Curso ou funcionário não encontrado" }
        } 
      } 
    },
    "/progress/v1/inscricoes/{id}": { 
      "get": { 
        "summary": "Obter inscrição por ID", 
        "tags": ["progress"], 
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }], 
        "responses": { 
          "200": { 
            "description": "Dados da inscrição",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": { "type": "string", "format": "uuid" },
                    "funcionario_id": { "type": "string", "format": "uuid" },
                    "curso_id": { "type": "string" },
                    "data_inscricao": { "type": "string", "format": "date-time" },
                    "data_inicio": { "type": "string", "format": "date-time" },
                    "data_conclusao": { "type": "string", "format": "date-time" },
                    "status": { "type": "string" },
                    "progresso_percentual": { "type": "integer" }
                  }
                }
              }
            }
          }, 
          "404": { "description": "Inscrição não encontrada" } 
        } 
      } 
    },
    "/progress/v1/inscricoes/usuario/{userId}": { 
      "get": { 
        "summary": "Listar inscrições do usuário", 
        "tags": ["progress"], 
        "parameters": [{ "name": "userId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }], 
        "responses": { 
          "200": { 
            "description": "Lista de inscrições do usuário",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": { "type": "string", "format": "uuid" },
                      "curso_id": { "type": "string" },
                      "status": { "type": "string" },
                      "progresso_percentual": { "type": "integer" },
                      "data_inscricao": { "type": "string", "format": "date-time" }
                    }
                  }
                }
              }
            }
          } 
        } 
      } 
    },
    "/progress/v1/inscricoes/{id}/progresso": { 
      "patch": { 
        "summary": "Atualizar progresso manualmente", 
        "tags": ["progress"], 
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }], 
        "requestBody": { 
          "required": true, 
          "content": { 
            "application/json": { 
              "schema": { 
                "type": "object", 
                "required": ["progresso_percentual"], 
                "properties": { 
                  "progresso_percentual": { "type": "integer", "minimum": 0, "maximum": 100, "description": "Percentual de progresso (0-100)" } 
                } 
              } 
            } 
          } 
        }, 
        "responses": { 
          "200": { 
            "description": "Progresso atualizado",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": { "type": "string", "format": "uuid" },
                    "progresso_percentual": { "type": "integer" },
                    "status": { "type": "string" }
                  }
                }
              }
            }
          }, 
          "404": { "description": "Inscrição não encontrada" } 
        } 
      } 
    },
    "/progress/v1/inscricoes/{id}/modulos/{moduloId}/concluir": {
      "post": {
        "summary": "Concluir módulo e atualizar progresso",
        "tags": ["progress"],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } },
          { "name": "moduloId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
          "201": {
            "description": "Módulo concluído",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "enrollmentId": { "type": "string", "format": "uuid" },
                    "moduleId": { "type": "string", "format": "uuid" },
                    "courseId": { "type": "string" },
                    "userId": { "type": "string" },
                    "progressPercent": { "type": "number" },
                    "completedCourse": { "type": "boolean" }
                  },
                  "required": ["enrollmentId", "moduleId", "courseId", "userId", "progressPercent", "completedCourse"]
                }
              }
            }
          },
          "404": { "description": "Não encontrado" }
        }
      }
    },
    "/progress/v1/certificates/user/{userId}": { 
      "get": { 
        "summary": "Listar certificados do usuário", 
        "tags": ["certificates"], 
        "parameters": [{ "name": "userId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }], 
        "responses": { "200": { "description": "Lista de certificados do usuário" } } 
      } 
    },
    "/progress/v1/certificates/enrollment/{enrollmentId}": { 
      "post": { 
        "summary": "Emitir ou recuperar certificado", 
        "tags": ["certificates"], 
        "parameters": [{ "name": "enrollmentId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }], 
        "responses": { 
          "201": { "description": "Certificado emitido/retornado" }, 
          "409": { "description": "Curso não concluído" }, 
          "404": { "description": "Inscrição não encontrada" } 
        } 
      } 
    },
    "/progress/v1/certificates/enrollment/{enrollmentId}/pdf": { 
      "get": { 
        "summary": "Gerar/obter link PDF do certificado", 
        "tags": ["certificates"], 
        "parameters": [{ "name": "enrollmentId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }], 
        "responses": { 
          "200": { "description": "URL de download retornada" }, 
          "404": { "description": "Inscrição ou certificado não encontrado" } 
        } 
      } 
    },
    "/progress/v1/certificates/validate/{code}": { 
      "get": { 
        "summary": "Validar certificado por código + hash", 
        "tags": ["certificates"], 
        "parameters": [ 
          { "name": "code", "in": "path", "required": true, "schema": { "type": "string" } }, 
          { "name": "hash", "in": "query", "required": true, "schema": { "type": "string" } } 
        ], 
        "responses": { 
          "200": { "description": "Resultado validação" }, 
          "400": { "description": "Parâmetros ausentes" }, 
          "404": { "description": "Não encontrado" } 
        } 
      } 
    },
    "/progress/v1/tracks": { 
      "get": { 
        "summary": "Listar trilhas", 
        "tags": ["tracks"], 
        "responses": { "200": { "description": "Lista de trilhas disponíveis" } } 
      } 
    },
    "/progress/v1/tracks/user/{userId}": { 
      "get": { 
        "summary": "Progresso em trilhas do usuário", 
        "tags": ["tracks"], 
        "parameters": [{ "name": "userId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }], 
        "responses": { "200": { "description": "Progresso do usuário nas trilhas" } } 
      } 
    }
  }
} as const;