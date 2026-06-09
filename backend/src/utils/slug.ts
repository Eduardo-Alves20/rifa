/**
 * Gera slug URL-amigável a partir de um nome.
 * Ex: "Sorteio de Natal 2024" → "sorteio-de-natal-2024"
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
