import crypto from "crypto";
import { loadFolders, saveFolders } from "../utils/fileSystem.js";
import { DEFAULT_TREE } from "../types/folder.js";
import { normalizeName } from "../utils/string.js";

/**
 * Estado da árvore de coleções em memória
 * @type {import('../types/folder.js').FolderNode[]}
 */
let folderTree = DEFAULT_TREE;

/**
 * Inicializa o serviço carregando dados do disco
 */
export async function initializeFolderService() {
    const loadedTree = await loadFolders();
    if (loadedTree) {
        folderTree = loadedTree;
    }
}

/**
 * Retorna a árvore atual
 * @returns {import('../types/folder.js').FolderNode[]}
 */
export function getFolderTree() {
    return folderTree;
}

/**
 * Adiciona uma nova coleção (raiz ou filho)
 * @param {string | null} parentId
 * @param {string} name
 * @returns {import('../types/folder.js').FolderNode[]}
 */
export function createFolder(parentId, name) {
    const normalizedName = normalizeName(name);
    if (!normalizedName) {
        throw new Error("Nome inválido");
    }

    const newNode = {
        id: crypto.randomUUID(),
        name: normalizedName,
        children: [],
    };

    if (!parentId) {
        folderTree = [...folderTree, newNode];
    } else {
        folderTree = addChildRecursive(folderTree, parentId, newNode);
    }

    void saveFolders(folderTree);
    return folderTree;
}

/**
 * Renomeia uma coleção existente
 * @param {string} id
 * @param {string} name
 * @returns {import('../types/folder.js').FolderNode[]}
 */
export function updateFolderName(id, name) {
    const normalizedName = normalizeName(name);
    if (!id || !normalizedName) {
        throw new Error("ID ou nome inválido");
    }

    folderTree = renameRecursive(folderTree, id, normalizedName);
    void saveFolders(folderTree);
    return folderTree;
}

/**
 * Remove uma coleção e seus filhos
 * @param {string} id
 * @returns {import('../types/folder.js').FolderNode[]}
 */
export function removeFolder(id) {
    if (!id) {
        throw new Error("ID inválido");
    }

    folderTree = deleteRecursive(folderTree, id);
    void saveFolders(folderTree);
    return folderTree;
}

// Funções auxiliares recursivas

function addChildRecursive(tree, parentId, newNode) {
    return tree.map((node) => {
        if (node.id === parentId) {
            return { ...node, children: [...node.children, newNode] };
        }
        return { ...node, children: addChildRecursive(node.children, parentId, newNode) };
    });
}

function renameRecursive(tree, id, name) {
    return tree.map((node) => {
        if (node.id === id) {
            return { ...node, name };
        }
        return { ...node, children: renameRecursive(node.children, id, name) };
    });
}

function deleteRecursive(tree, id) {
    return tree.filter((node) => node.id !== id).map((node) => ({ ...node, children: deleteRecursive(node.children, id) }));
}
