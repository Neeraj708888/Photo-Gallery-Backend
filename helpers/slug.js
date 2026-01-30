export const slug = (text) =>
    text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "-");
