import type { CollectionNode } from "../model/folderTypes";

/**
 * Coleta todos os IDs de uma coleção e suas subcoleções
 */
export function collectAllCollectionIds(collections: CollectionNode[], targetId: string): string[] {
    const result: string[] = [];

    const collectFromNode = (node: CollectionNode) => {
        result.push(node.id);
        node.children.forEach(collectFromNode);
    };

    const findAndCollect = (nodes: CollectionNode[]): boolean => {
        for (const node of nodes) {
            if (node.id === targetId) {
                collectFromNode(node);
                return true;
            }
            if (findAndCollect(node.children)) return true;
        }
        return false;
    };

    findAndCollect(collections);
    return result;
}

/**
 * Encontra o nome de uma coleção pelo ID
 */
export function getCollectionName(collections: CollectionNode[], targetId: string): string {
    const find = (nodes: CollectionNode[]): string | null => {
        for (const node of nodes) {
            if (node.id === targetId) return node.name;
            const found = find(node.children);
            if (found) return found;
        }
        return null;
    };
    return find(collections) || "";
}

/**
 * Constrói o caminho de uma coleção (breadcrumb)
 */
export function getCollectionPath(collections: CollectionNode[], targetId: string): string[] {
    const path: string[] = [];

    const findPath = (nodes: CollectionNode[], currentPath: string[]): boolean => {
        for (const node of nodes) {
            const newPath = [...currentPath, node.name];
            if (node.id === targetId) {
                path.push(...newPath);
                return true;
            }
            if (findPath(node.children, newPath)) return true;
        }
        return false;
    };

    findPath(collections, []);
    return path;
}
