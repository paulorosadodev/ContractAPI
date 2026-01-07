export type FolderId = string;

export type CollectionNode = {
    id: FolderId;
    name: string;
    children: CollectionNode[];
};

export type Field = {
    id: string;
    name: string;
    type: string;
    required: boolean;
};

export type ObjectNode = {
    id: string;
    name: string;
    collectionId: string;
    fields: Field[];
    kind: "interface" | "type" | "enum";
    enumValues?: string[];
};

export type Role = {
    id: string;
    name: string;
    order: number;
};

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryParam = {
    id: string;
    name: string;
    type: string;
    required: boolean;
    description?: string;
};

export type EndpointNode = {
    id: string;
    name: string;
    collectionId: string;
    path: string;
    method: HttpMethod;
    minRole?: string;
    queryParams: QueryParam[];
    requestBody?: string;
    responseBody?: string;
    description?: string;
};

export type DataStore = {
    collections: CollectionNode[];
    objects: ObjectNode[];
    roles: Role[];
    endpoints: EndpointNode[];
};

// Mantém FolderNode como alias para compatibilidade
export type FolderNode = CollectionNode;
