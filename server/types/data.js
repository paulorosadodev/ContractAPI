/**
 * Tipos suportados para campos de objetos
 */
export const FIELD_TYPES = {
    // Primitivos
    STRING: "string",
    NUMBER: "number",
    BOOLEAN: "boolean",
    NULL: "null",
    UNDEFINED: "undefined",
    ANY: "any",
    UNKNOWN: "unknown",

    // Arrays
    STRING_ARRAY: "string[]",
    NUMBER_ARRAY: "number[]",
    BOOLEAN_ARRAY: "boolean[]",
    ANY_ARRAY: "any[]",

    // Objetos
    OBJECT: "object",
    RECORD: "Record<string, any>",

    // Utilitários
    DATE: "Date",
    PROMISE: "Promise<any>",
};

/**
 * @typedef {Object} Field
 * @property {string} id - UUID do campo
 * @property {string} name - Nome do campo
 * @property {string} type - Tipo do campo
 * @property {boolean} required - Se o campo é obrigatório
 */

/**
 * @typedef {Object} ObjectNode
 * @property {string} id - UUID do objeto
 * @property {string} name - Nome do objeto/interface
 * @property {string} collectionId - ID da coleção pai
 * @property {Field[]} fields - Campos do objeto
 * @property {'interface' | 'type' | 'enum'} kind - Tipo de definição
 * @property {string[]} [enumValues] - Valores do enum (se kind === 'enum')
 */

/**
 * @typedef {Object} CollectionNode
 * @property {string} id - UUID da coleção
 * @property {string} name - Nome da coleção
 * @property {CollectionNode[]} children - Subcoleções
 */

/**
 * @typedef {Object} DataStore
 * @property {CollectionNode[]} collections - Árvore de coleções
 * @property {ObjectNode[]} objects - Lista de todos os objetos
 * @property {Role[]} roles - Lista de roles ordenadas
 */

/**
 * @typedef {Object} Role
 * @property {string} id - UUID da role
 * @property {string} name - Nome da role
 * @property {number} order - Ordem de importância (menor = mais importante)
 */

/**
 * @typedef {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'} HttpMethod
 */

/**
 * @typedef {Object} QueryParam
 * @property {string} id - UUID do parâmetro
 * @property {string} name - Nome do parâmetro
 * @property {string} type - Tipo do parâmetro
 * @property {boolean} required - Se o parâmetro é obrigatório
 * @property {string} [description] - Descrição do parâmetro
 */

/**
 * @typedef {Object} EndpointNode
 * @property {string} id - UUID do endpoint
 * @property {string} name - Nome do endpoint
 * @property {string} collectionId - ID da coleção pai
 * @property {string} path - Path do endpoint (ex: /users/:id)
 * @property {HttpMethod} method - Método HTTP
 * @property {string} [minRole] - Role mínima para acesso
 * @property {QueryParam[]} queryParams - Parâmetros de query
 * @property {string} [requestBody] - Corpo da requisição (referência a objeto)
 * @property {string} [responseBody] - Corpo da resposta (referência a objeto)
 * @property {string} [description] - Descrição do endpoint
 */

/**
 * Estrutura padrão vazia
 */
export const DEFAULT_DATA = {
    collections: [],
    objects: [],
    roles: [],
    endpoints: [],
};
