import type { FolderId, FolderNode } from "./folderTypes";

export function createFolderNode(name: string): FolderNode {
    return {
        id: crypto.randomUUID(),
        name,
        children: [],
    };
}

export function findNode(tree: FolderNode[], id: FolderId): FolderNode | null {
    for (const node of tree) {
        if (node.id === id) return node;
        const inChildren = findNode(node.children, id);
        if (inChildren) return inChildren;
    }
    return null;
}

export function addChildFolder(tree: FolderNode[], parentId: FolderId | null, name: string): FolderNode[] {
    const newNode = createFolderNode(name);

    if (!parentId) {
        return [...tree, newNode];
    }

    return tree.map((node) => {
        if (node.id === parentId) {
            return { ...node, children: [...node.children, newNode] };
        }
        return { ...node, children: addChildFolder(node.children, parentId, name) };
    });
}

export function renameFolder(tree: FolderNode[], id: FolderId, name: string): FolderNode[] {
    return tree.map((node) => {
        if (node.id === id) {
            return { ...node, name };
        }
        return { ...node, children: renameFolder(node.children, id, name) };
    });
}

export function deleteFolder(tree: FolderNode[], id: FolderId): FolderNode[] {
    return tree.filter((node) => node.id !== id).map((node) => ({ ...node, children: deleteFolder(node.children, id) }));
}
