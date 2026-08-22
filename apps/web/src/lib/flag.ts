// ISO-3166 alpha-2 -> эмодзи-флаг ("UZ" -> 🇺🇿)
export function ccToFlag(cc?: string | null): string | null {
  if (!cc || !/^[A-Za-z]{2}$/.test(cc)) return null;
  return cc
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}
