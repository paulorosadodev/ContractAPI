import { randomUUID } from "node:crypto";
import { loadData, saveData } from "../utils/fileSystem.js";
import { DEFAULT_DATA } from "../types/data.js";
import { normalizeName } from "../utils/string.js";

/**
 * Estado global em memória
 * @type {import('../types/data.js').DataStore}
 */
let dataStore = DEFAULT_DATA;

/**
 * Inicializa o serviço carregando dados do disco
 */
export async function initializeDataService() {
    const loaded = await loadData();
    if (loaded) {
        dataStore = loaded;
    }
}

/**
 * Retorna o estado completo
 * @returns {import('../types/data.js').DataStore}
 */
export function getDataStore() {
    return dataStore;
}

/**
 * Importa dados substituindo o estado atual
 * @param {import('../types/data.js').DataStore} data
 * @returns {import('../types/data.js').DataStore}
 */
export function importData(data) {
    if (!data || !Array.isArray(data.collections) || !Array.isArray(data.objects)) {
        throw new Error("Dados inválidos para importação");
    }
    dataStore = data;
    void saveData(dataStore);
    return dataStore;
}

// ============================================
// OPERAÇÕES DE COLEÇÕES
// ============================================

/**
 * Cria uma nova coleção
 * @param {string | null} parentId
 * @param {string} name
 * @returns {import('../types/data.js').DataStore}
 */
export function createCollection(parentId, name) {
    const normalizedName = normalizeName(name);
    const newNode = {
        id: randomUUID(),
        name: normalizedName,
        children: [],
    };

    if (!parentId) {
        dataStore.collections = [...dataStore.collections, newNode];
    } else {
        dataStore.collections = addChildRecursive(dataStore.collections, parentId, newNode);
    }

    void saveData(dataStore);
    return dataStore;
}

/**
 * Renomeia uma coleção
 * @param {string} id
 * @param {string} name
 * @returns {import('../types/data.js').DataStore}
 */
export function renameCollection(id, name) {
    const normalizedName = normalizeName(name);
    if (!normalizedName) {
        throw new Error("Nome inválido");
    }

    dataStore.collections = renameRecursive(dataStore.collections, id, normalizedName);
    void saveData(dataStore);
    return dataStore;
}

/**
 * Remove uma coleção e todos seus filhos e objetos
 * @param {string} id
 * @returns {import('../types/data.js').DataStore}
 */
export function deleteCollection(id) {
    if (!id) {
        throw new Error("ID inválido");
    }

    // Remove objetos da coleção e subcoleções
    const collectionIds = getCollectionIdsRecursive([id], dataStore.collections);
    dataStore.objects = dataStore.objects.filter((obj) => !collectionIds.includes(obj.collectionId));

    // Remove endpoints da coleção e subcoleções
    if (dataStore.endpoints) {
        dataStore.endpoints = dataStore.endpoints.filter((ep) => !collectionIds.includes(ep.collectionId));
    }
    dataStore.objects = dataStore.objects.filter((obj) => !collectionIds.includes(obj.collectionId));

    dataStore.collections = deleteRecursive(dataStore.collections, id);
    void saveData(dataStore);
    return dataStore;
}

/**
 * Move uma coleção para outro pai (ou raiz se newParentId for null)
 * @param {string} id - ID da coleção a mover
 * @param {string | null} newParentId - ID do novo pai (null = raiz)
 * @returns {import('../types/data.js').DataStore}
 */
export function moveCollection(id, newParentId) {
    if (!id) {
        throw new Error("ID inválido");
    }

    // Não pode mover para si mesmo ou para um descendente
    if (id === newParentId) {
        throw new Error("Não é possível mover uma coleção para si mesma");
    }

    // Encontra e remove a coleção da posição atual
    let movedNode = null;
    const findAndRemove = (nodes) => {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === id) {
                movedNode = nodes[i];
                return [...nodes.slice(0, i), ...nodes.slice(i + 1)];
            }
            if (nodes[i].children.length > 0) {
                const newChildren = findAndRemove(nodes[i].children);
                if (movedNode) {
                    return nodes.map((n, idx) => (idx === i ? { ...n, children: newChildren } : n));
                }
            }
        }
        return nodes;
    };

    dataStore.collections = findAndRemove(dataStore.collections);

    if (!movedNode) {
        throw new Error("Coleção não encontrada");
    }

    // Verifica se newParentId é descendente da coleção movida
    const isDescendant = (node, targetId) => {
        if (node.id === targetId) return true;
        return node.children.some((child) => isDescendant(child, targetId));
    };
    if (newParentId && isDescendant(movedNode, newParentId)) {
        throw new Error("Não é possível mover uma coleção para dentro de si mesma");
    }

    // Adiciona na nova posição
    if (!newParentId) {
        dataStore.collections = [...dataStore.collections, movedNode];
    } else {
        dataStore.collections = addChildRecursive(dataStore.collections, newParentId, movedNode);
    }

    void saveData(dataStore);
    return dataStore;
}

// ============================================
// OPERAÇÕES DE OBJETOS
// ============================================

/**
 * Cria um novo objeto em uma coleção
 * @param {string} collectionId
 * @param {string} name
 * @param {'interface' | 'type' | 'enum'} kind
 * @param {Array<{name: string, type: string, required: boolean}>} fields
 * @param {string[]} enumValues
 * @returns {import('../types/data.js').DataStore}
 */
export function createObject(collectionId, name, kind = "interface", fields = [], enumValues = []) {
    const normalizedName = normalizeName(name);
    const newObject = {
        id: randomUUID(),
        name: normalizedName,
        collectionId,
        fields: fields.map((f) => ({
            id: randomUUID(),
            name: normalizeName(f.name),
            type: f.type,
            required: f.required,
        })),
        kind,
        enumValues: kind === "enum" ? enumValues : undefined,
    };

    dataStore.objects = [...dataStore.objects, newObject];
    void saveData(dataStore);
    return dataStore;
}

/**
 * Atualiza um objeto existente
 * @param {string} id
 * @param {Partial<import('../types/data.js').ObjectNode>} updates
 * @returns {import('../types/data.js').DataStore}
 */
export function updateObject(id, updates) {
    const index = dataStore.objects.findIndex((obj) => obj.id === id);
    if (index === -1) {
        throw new Error("Objeto não encontrado");
    }

    dataStore.objects[index] = {
        ...dataStore.objects[index],
        ...updates,
        id,
    };

    void saveData(dataStore);
    return dataStore;
}

/**
 * Remove um objeto
 * @param {string} id
 * @returns {import('../types/data.js').DataStore}
 */
export function deleteObject(id) {
    dataStore.objects = dataStore.objects.filter((obj) => obj.id !== id);
    void saveData(dataStore);
    return dataStore;
}

/**
 * Move um objeto para outra coleção
 * @param {string} id - ID do objeto a mover
 * @param {string} newCollectionId - ID da nova coleção (string vazia = raiz)
 * @returns {import('../types/data.js').DataStore}
 */
export function moveObject(id, newCollectionId) {
    const index = dataStore.objects.findIndex((obj) => obj.id === id);
    if (index === -1) {
        throw new Error("Objeto não encontrado");
    }

    dataStore.objects[index] = {
        ...dataStore.objects[index],
        collectionId: newCollectionId || "",
    };

    void saveData(dataStore);
    return dataStore;
}

// ============================================
// OPERAÇÕES DE ROLES
// ============================================

/**
 * Cria uma nova role
 * @param {string} name
 * @returns {import('../types/data.js').DataStore}
 */
export function createRole(name) {
    const normalizedName = normalizeName(name);
    if (!normalizedName) {
        throw new Error("Nome inválido");
    }

    // Inicializa roles se não existir
    if (!dataStore.roles) {
        dataStore.roles = [];
    }

    const maxOrder = dataStore.roles.reduce((max, r) => Math.max(max, r.order), -1);
    const newRole = {
        id: randomUUID(),
        name: normalizedName,
        order: maxOrder + 1,
    };

    dataStore.roles = [...dataStore.roles, newRole];
    void saveData(dataStore);
    return dataStore;
}

/**
 * Renomeia uma role
 * @param {string} id
 * @param {string} name
 * @returns {import('../types/data.js').DataStore}
 */
export function renameRole(id, name) {
    const normalizedName = normalizeName(name);
    if (!normalizedName) {
        throw new Error("Nome inválido");
    }

    const index = dataStore.roles.findIndex((r) => r.id === id);
    if (index === -1) {
        throw new Error("Role não encontrada");
    }

    dataStore.roles[index] = { ...dataStore.roles[index], name: normalizedName };
    void saveData(dataStore);
    return dataStore;
}

/**
 * Remove uma role
 * @param {string} id
 * @returns {import('../types/data.js').DataStore}
 */
export function deleteRole(id) {
    dataStore.roles = dataStore.roles.filter((r) => r.id !== id);
    void saveData(dataStore);
    return dataStore;
}

/**
 * Reordena as roles
 * @param {string[]} orderedIds - Array de IDs na nova ordem
 * @returns {import('../types/data.js').DataStore}
 */
export function reorderRoles(orderedIds) {
    const roleMap = new Map(dataStore.roles.map((r) => [r.id, r]));
    dataStore.roles = orderedIds.map((id, index) => {
        const role = roleMap.get(id);
        if (!role) throw new Error(`Role não encontrada: ${id}`);
        return { ...role, order: index };
    });
    void saveData(dataStore);
    return dataStore;
}

// ============================================
// OPERAÇÕES DE ENDPOINTS
// ============================================

/**
 * Cria um novo endpoint em uma coleção
 * @param {string} collectionId
 * @param {string} name
 * @param {string} path
 * @param {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'} method
 * @param {string} [minRole]
 * @param {Array<{name: string, type: string, required: boolean, description?: string}>} [queryParams]
 * @param {string} [requestBody]
 * @param {string} [responseBody]
 * @param {string} [description]
 * @returns {import('../types/data.js').DataStore}
 */
export function createEndpoint(collectionId, name, path, method = "GET", minRole = "", queryParams = [], requestBody = "", responseBody = "", description = "") {
    const normalizedName = normalizeName(name);

    // Inicializa endpoints se não existir
    if (!dataStore.endpoints) {
        dataStore.endpoints = [];
    }

    const newEndpoint = {
        id: randomUUID(),
        name: normalizedName,
        collectionId,
        path: path || "/",
        method,
        minRole,
        queryParams: queryParams.map((p) => ({
            id: randomUUID(),
            name: normalizeName(p.name),
            type: p.type,
            required: p.required,
            description: p.description || "",
        })),
        requestBody,
        responseBody,
        description,
    };

    dataStore.endpoints = [...dataStore.endpoints, newEndpoint];
    void saveData(dataStore);
    return dataStore;
}

/**
 * Atualiza um endpoint existente
 * @param {string} id
 * @param {Partial<import('../types/data.js').EndpointNode>} updates
 * @returns {import('../types/data.js').DataStore}
 */
export function updateEndpoint(id, updates) {
    if (!dataStore.endpoints) {
        dataStore.endpoints = [];
    }

    const index = dataStore.endpoints.findIndex((ep) => ep.id === id);
    if (index === -1) {
        throw new Error("Endpoint não encontrado");
    }

    dataStore.endpoints[index] = {
        ...dataStore.endpoints[index],
        ...updates,
        id,
    };

    void saveData(dataStore);
    return dataStore;
}

/**
 * Remove um endpoint
 * @param {string} id
 * @returns {import('../types/data.js').DataStore}
 */
export function deleteEndpoint(id) {
    if (!dataStore.endpoints) {
        dataStore.endpoints = [];
    }

    dataStore.endpoints = dataStore.endpoints.filter((ep) => ep.id !== id);
    void saveData(dataStore);
    return dataStore;
}

/**
 * Move um endpoint para outra coleção
 * @param {string} id - ID do endpoint a mover
 * @param {string} newCollectionId - ID da nova coleção (string vazia = raiz)
 * @returns {import('../types/data.js').DataStore}
 */
export function moveEndpoint(id, newCollectionId) {
    if (!dataStore.endpoints) {
        dataStore.endpoints = [];
    }

    const index = dataStore.endpoints.findIndex((ep) => ep.id === id);
    if (index === -1) {
        throw new Error("Endpoint não encontrado");
    }

    dataStore.endpoints[index] = {
        ...dataStore.endpoints[index],
        collectionId: newCollectionId || "",
    };

    void saveData(dataStore);
    return dataStore;
}

// ============================================
// FUNÇÕES AUXILIARES RECURSIVAS
// ============================================

function addChildRecursive(nodes, parentId, newNode) {
    return nodes.map((node) => {
        if (node.id === parentId) {
            return { ...node, children: [...node.children, newNode] };
        }
        if (node.children.length > 0) {
            return { ...node, children: addChildRecursive(node.children, parentId, newNode) };
        }
        return node;
    });
}

function renameRecursive(nodes, targetId, newName) {
    return nodes.map((node) => {
        if (node.id === targetId) {
            return { ...node, name: newName };
        }
        if (node.children.length > 0) {
            return { ...node, children: renameRecursive(node.children, targetId, newName) };
        }
        return node;
    });
}

function deleteRecursive(nodes, targetId) {
    return nodes.filter((node) => node.id !== targetId).map((node) => ({ ...node, children: deleteRecursive(node.children, targetId) }));
}

function getCollectionIdsRecursive(ids, collections) {
    const result = [...ids];
    for (const collection of collections) {
        if (ids.includes(collection.id)) {
            result.push(...getAllChildIds(collection));
        }
    }
    return result;
}

function getAllChildIds(node) {
    const ids = [node.id];
    for (const child of node.children) {
        ids.push(...getAllChildIds(child));
    }
    return ids;
}
