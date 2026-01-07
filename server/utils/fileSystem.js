import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "../data");
const dataFilePath = path.join(dataDir, "data.json");

let saveQueue = Promise.resolve();

/**
 * Garante que o diretório de dados existe
 */
async function ensureDataDir() {
    await fs.mkdir(dataDir, { recursive: true });
}

/**
 * Carrega os dados (coleções e objetos) do disco
 * @returns {Promise<import('../types/data.js').DataStore | null>}
 */
export async function loadData() {
    await ensureDataDir();
    try {
        const raw = await fs.readFile(dataFilePath, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.collections) && Array.isArray(parsed.objects)) {
            return parsed;
        }
        return null;
    } catch (err) {
        if (err && err.code !== "ENOENT") {
            console.error("Erro ao ler data.json:", err);
        }
        return null;
    }
}

/**
 * Salva os dados (coleções e objetos) no disco de forma atômica
 * @param {import('../types/data.js').DataStore} data
 * @returns {Promise<void>}
 */
export async function saveData(data) {
    saveQueue = saveQueue
        .then(async () => {
            await ensureDataDir();
            const tmpPath = `${dataFilePath}.tmp`;
            await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
            await fs.rename(tmpPath, dataFilePath);
        })
        .catch((err) => {
            console.error("Erro ao salvar data.json:", err);
        });

    return saveQueue;
}
