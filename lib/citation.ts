export type CitationParts = { id: string; author: string | null; title: string; date: string; year: string; url: string };

const escapeBibtex = (text: string) => text.replace(/[&%#_$]/g, String.raw`\$&`);

export const apaCitation = ({ author, title, date, url }: CitationParts) => {
    const authorPart = author ? `${author}. ` : "";
    return `${authorPart}(${date}). ${title}. Compendia. ${url}`;
};

export const bibtexCitation = ({ id, author, title, year, url }: CitationParts) =>
    [
        `@misc{compendia-${id.slice(0, 8)},`,
        ...(author ? [`  author = {${escapeBibtex(author)}},`] : []),
        `  title = {{${escapeBibtex(title)}}},`,
        `  year = {${year}},`,
        "  howpublished = {Compendia},",
        `  url = {${url}}`,
        "}",
    ].join("\n");
