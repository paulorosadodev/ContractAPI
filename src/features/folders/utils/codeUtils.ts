import type { ObjectNode } from "../model/folderTypes";

// CSS Variables para syntax highlighting (definidas em index.css)
export const CODE_COLORS = {
    keyword: "var(--code-keyword)",
    name: "var(--code-type)",
    type: "var(--code-property)",
    property: "var(--code-punctuation)",
    optional: "var(--code-string)",
    punctuation: "var(--code-punctuation)",
    comment: "var(--code-comment)",
};

/**
 * Gera código TypeScript para um objeto (interface, type ou enum)
 */
export function generateTypeScriptCode(obj: ObjectNode): string {
    if (obj.kind === "enum") {
        const values = obj.enumValues?.map((v: string) => `  ${v},`).join("\n") || "";
        return `export enum ${obj.name} {\n${values}\n}`;
    }

    const keyword = obj.kind === "interface" ? "interface" : "type";
    const fields = obj.fields
        .map((field) => {
            const optional = field.required ? "" : "?";
            return `  ${field.name}${optional}: ${field.type};`;
        })
        .join("\n");

    if (keyword === "interface") {
        return `export interface ${obj.name} {\n${fields}\n}`;
    } else {
        return `export type ${obj.name} = {\n${fields}\n};`;
    }
}

/**
 * Gera código TypeScript com syntax highlighting HTML
 */
export function generateTypeScriptCodeHighlighted(obj: ObjectNode, allObjects?: ObjectNode[]): string {
    const span = (color: string, text: string) => `<span style="color:${color}">${text}</span>`;

    // Cria um set de nomes de objetos para verificação rápida
    const objectNames = new Set(allObjects?.map((o) => o.name) || []);

    // Função para renderizar o tipo, tornando clicável se for um objeto conhecido
    const renderType = (type: string) => {
        // Remove [] para verificar o tipo base
        const baseType = type.replace("[]", "");
        const isArray = type.endsWith("[]");

        if (objectNames.has(baseType)) {
            // É um objeto conhecido - torna clicável com underline e bold
            const objectSpan = `<span class="object-type-link" data-object-name="${baseType}" style="color:${CODE_COLORS.type};text-decoration:underline;font-weight:600;cursor:pointer">${baseType}</span>`;
            return isArray ? objectSpan + span(CODE_COLORS.punctuation, "[]") : objectSpan;
        }
        return span(CODE_COLORS.type, type);
    };

    if (obj.kind === "enum") {
        const values = obj.enumValues?.map((v: string) => `  ${span(CODE_COLORS.property, v)},`).join("\n") || "";
        return `${span(CODE_COLORS.keyword, "export")} ${span(CODE_COLORS.keyword, "enum")} ${span(CODE_COLORS.name, obj.name)} ${span(CODE_COLORS.punctuation, "{")}\n${values}\n${span(CODE_COLORS.punctuation, "}")}`;
    }

    const keyword = obj.kind === "interface" ? "interface" : "type";
    const fields = obj.fields
        .map((field) => {
            const optional = field.required ? "" : span(CODE_COLORS.optional, "?");
            return `  ${span(CODE_COLORS.property, field.name)}${optional}${span(CODE_COLORS.punctuation, ":")} ${renderType(field.type)}${span(CODE_COLORS.punctuation, ";")}`;
        })
        .join("\n");

    if (keyword === "interface") {
        return `${span(CODE_COLORS.keyword, "export")} ${span(CODE_COLORS.keyword, "interface")} ${span(CODE_COLORS.name, obj.name)} ${span(CODE_COLORS.punctuation, "{")}\n${fields}\n${span(CODE_COLORS.punctuation, "}")}`;
    } else {
        return `${span(CODE_COLORS.keyword, "export")} ${span(CODE_COLORS.keyword, "type")} ${span(CODE_COLORS.name, obj.name)} ${span(CODE_COLORS.punctuation, "=")} ${span(CODE_COLORS.punctuation, "{")}\n${fields}\n${span(CODE_COLORS.punctuation, "};")}`;
    }
}

/**
 * Converte um objeto/interface em JSON de exemplo
 */
export function objectToJson(obj: ObjectNode, allObjects: ObjectNode[], depth = 0): unknown {
    if (depth > 5) return {}; // Previne recursão infinita

    if (obj.kind === "enum") {
        return obj.enumValues?.[0] || "ENUM_VALUE";
    }

    const result: Record<string, unknown> = {};
    for (const field of obj.fields) {
        const fieldName = field.name || "field";
        let value: unknown;

        // Tipos primitivos
        if (field.type === "string") value = "string";
        else if (field.type === "number") value = 0;
        else if (field.type === "boolean") value = true;
        else if (field.type === "date") value = "2024-01-01";
        else if (field.type === "any") value = null;
        else if (field.type.endsWith("[]")) {
            // Array
            const baseType = field.type.slice(0, -2);
            const refObj = allObjects.find((o) => o.name === baseType);
            if (refObj) {
                value = [objectToJson(refObj, allObjects, depth + 1)];
            } else {
                value = [];
            }
        } else {
            // Referência a outro objeto
            const refObj = allObjects.find((o) => o.name === field.type);
            if (refObj) {
                value = objectToJson(refObj, allObjects, depth + 1);
            } else {
                value = {};
            }
        }

        result[fieldName] = value;
    }
    return result;
}

/**
 * Aplica syntax highlighting em JSON
 */
export function highlightJson(json: string): string {
    if (!json.trim()) return "";

    // Escapa HTML
    const escaped = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Aplica cores
    return (
        escaped
            // Strings (chaves e valores)
            .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
                return `<span style="color:var(--code-string)">${match}</span>`;
            })
            // Números
            .replace(/\b(-?\d+\.?\d*)\b/g, '<span style="color:var(--code-number)">$1</span>')
            // Booleanos e null
            .replace(/\b(true|false|null)\b/g, '<span style="color:var(--code-keyword)">$1</span>')
    );
}
