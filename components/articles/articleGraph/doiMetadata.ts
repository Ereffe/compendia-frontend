import { type DoiRecord, type GraphNode, normalizeDoi, toNodeId } from "./articleGraphController";

type CslName = { given?: string; family?: string; literal?: string; name?: string };

export type CslItem = {
    title?: string | string[];
    author?: CslName[];
    abstract?: string;
    reference?: { DOI?: string }[];
};

const stripTags = (text: string) => text.replace(/<[^>]*>/g, " ").split(/\s/).filter(Boolean).join(" ");

const formatName = (name: CslName) =>
    name.family ? [name.family, name.given].filter(Boolean).join(", ") : (name.literal ?? name.name ?? "");

export const cslToGraphNode = (doi: string, csl: CslItem): GraphNode | null => {
    const rawTitle = Array.isArray(csl.title) ? csl.title[0] : csl.title;
    const title = rawTitle ? stripTags(rawTitle) : "";
    if (!title) return null;
    return {
        doi,
        title,
        authors: (csl.author ?? []).map(formatName).filter(Boolean),
        description: csl.abstract ? stripTags(csl.abstract) : null,
        url: `https://doi.org/${doi}`,
    };
};

export const cslToRecord = (doi: string, csl: CslItem): DoiRecord => {
    const references = new Map<string, string>();
    for (const reference of csl.reference ?? []) {
        const referenceDoi = reference.DOI ? normalizeDoi(reference.DOI) : "";
        if (referenceDoi) references.set(toNodeId(referenceDoi), referenceDoi);
    }
    references.delete(toNodeId(doi));
    return { node: cslToGraphNode(doi, csl), references: [...references.values()] };
};

const EMPTY_RECORD: DoiRecord = { node: null, references: [] };
const LOOKUP_SPACING_MS = 250;
const RETRY_DELAY_MS = 1500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Crossref allows 5 requests/s and one at a time; its 429 has no CORS header, so it surfaces as a network error.
async function requestRecord(doi: string, retries: number): Promise<DoiRecord | null> {
    try {
        const response = await fetch(`https://doi.org/${encodeURI(doi).replaceAll("#", "%23").replaceAll("?", "%3F")}`, {
            headers: { Accept: "application/vnd.citationstyles.csl+json" },
            signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) return EMPTY_RECORD;
        return cslToRecord(doi, (await response.json()) as CslItem);
    } catch {
        if (retries <= 0) return null;
        await delay(RETRY_DELAY_MS);
        return requestRecord(doi, retries - 1);
    }
}

const records = new Map<string, Promise<DoiRecord | null>>();

export async function fetchDoiRecord(doi: string): Promise<DoiRecord> {
    const id = toNodeId(doi);
    let pending = records.get(id);
    if (!pending) {
        pending = Promise.all([requestRecord(doi, 1), delay(LOOKUP_SPACING_MS)]).then(([record]) => record);
        records.set(id, pending);
    }
    const record = await pending;
    if (!record) records.delete(id);
    return record ?? EMPTY_RECORD;
}

export const clearDoiRecordCache = () => records.clear();
