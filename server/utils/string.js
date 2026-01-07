/**
 * Normaliza o nome removendo espaços extras
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function normalizeName(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ");
}

/**
 * Gera um UUID v4
 * @returns {string}
 */
export function generateId() {
    return crypto.randomUUID();
}
