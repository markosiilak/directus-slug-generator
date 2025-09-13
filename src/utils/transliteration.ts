// Transliteration map for converting special characters to ASCII
export const transliterationMap: { [key: string]: string } = {
  // Russian
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  // Uppercase Russian
  А: "A",
  Б: "B",
  В: "V",
  Г: "G",
  Д: "D",
  Е: "E",
  Ё: "Yo",
  Ж: "Zh",
  З: "Z",
  И: "I",
  Й: "Y",
  К: "K",
  Л: "L",
  М: "M",
  Н: "N",
  О: "O",
  П: "P",
  Р: "R",
  С: "S",
  Т: "T",
  У: "U",
  Ф: "F",
  Х: "H",
  Ц: "Ts",
  Ч: "Ch",
  Ш: "Sh",
  Щ: "Sch",
  Ъ: "",
  Ы: "Y",
  Ь: "",
  Э: "E",
  Ю: "Yu",
  Я: "Ya",
  // Ukrainian (added by YuriiKosiy for Ukrainian language)
  є: "ye",
  ї: "yi",
  і: "i",
  ґ: "g",
  // Uppercase Ukrainian (added by YuriiKosiy)
  Є: "Ye",
  Ї: "Yi",
  І: "I",
  Ґ: "G",
  // German and Nordic (consolidated)
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
  å: "a",
  æ: "ae",
  ø: "o",
  Ä: "Ae",
  Ö: "Oe",
  Ü: "Ue",
  Å: "A",
  Æ: "Ae",
  Ø: "O",
  // Latin-based characters (consolidated)
  á: "a",
  à: "a",
  â: "a",
  ą: "a",
  ć: "c",
  ç: "c",
  č: "c",
  ĉ: "c",
  ď: "d",
  đ: "d",
  é: "e",
  è: "e",
  ê: "e",
  ë: "e",
  ę: "e",
  ě: "e",
  í: "i",
  ì: "i",
  î: "i",
  ï: "i",
  ł: "l",
  ń: "n",
  ň: "n",
  ñ: "ny",
  ó: "o",
  ò: "o",
  ô: "o",
  ő: "o",
  ř: "r",
  ś: "s",
  š: "s",
  ş: "s",
  ť: "t",
  ú: "u",
  ù: "u",
  û: "u",
  ů: "u",
  ű: "u",
  ý: "y",
  ÿ: "y",
  ź: "z",
  ż: "z",
  ž: "z",
  // Uppercase Latin-based characters (consolidated)
  Á: "A",
  À: "A",
  Â: "A",
  Ą: "A",
  Ć: "C",
  Ç: "C",
  Č: "C",
  Ĉ: "C",
  Ď: "D",
  Đ: "D",
  É: "E",
  È: "E",
  Ê: "E",
  Ë: "E",
  Ę: "E",
  Ě: "E",
  Í: "I",
  Ì: "I",
  Î: "I",
  Ï: "I",
  Ł: "L",
  Ń: "N",
  Ň: "N",
  Ñ: "Ny",
  Ó: "O",
  Ò: "O",
  Ô: "O",
  Ő: "O",
  Ř: "R",
  Ś: "S",
  Š: "S",
  Ş: "S",
  Ť: "T",
  Ú: "U",
  Ù: "U",
  Û: "U",
  Ů: "U",
  Ű: "U",
  Ý: "Y",
  Ÿ: "Y",
  Ź: "Z",
  Ż: "Z",
  Ž: "Z",
};

/**
 * Transliterates a string by converting special characters to their ASCII equivalents
 * @param text The text to transliterate
 * @returns The transliterated text
 */
export const transliterate = (text: string): string => {
  if (!text || typeof text !== "string") return "";

  return text
    .split("")
    .map((char) => {
      return transliterationMap[char] || char;
    })
    .join("");
};

/**
 * Creates a URL-friendly slug from a string
 * @param text The text to convert to a slug
 * @param options Options for slug generation
 * @returns The generated slug
 */
export const createSlug = (
  text: string,
  options: {
    separator?: string;
    lowercase?: boolean;
  } = {},
): string => {
  const { separator = "-", lowercase = true } = options;

  // Ensure text is a string
  if (!text || typeof text !== "string") return "";

  // Check if the input is a URL
  const isUrl = /^https?:\/\//i.test(text);

  // Convert to lowercase if option is enabled
  let slug = lowercase ? text.toLowerCase() : text;

  if (isUrl) {
    // For URLs, preserve the protocol and slashes while cleaning other special characters
    const [protocol, rest] = slug.split("://");
    if (protocol && rest) {
      // Clean the rest of the URL while preserving slashes
      const cleanedRest = rest
        .normalize("NFD") // Normalize to decomposed form
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/[^a-zA-Z0-9\-/.:]/g, "") // Allow dots, slashes, and colons for URLs
        .trim();

      // Reconstruct the URL
      slug = `${protocol}://${cleanedRest}`;
    }
  } else {
    // First transliterate special characters
    slug = transliterate(slug);

    // Then apply the standard slug cleaning
    slug = slug
      .normalize("NFD") // Normalize to decomposed form
      .replace(/[\u0300-\u036f]/g, "") // Remove any remaining diacritics
      .replace(/[^a-zA-Z0-9\-/ ]/g, "") // Remove special chars, but allow slashes and hyphens
      .trim()
      .replace(/\s+/g, separator); // Replace spaces with separator
  }

  // Handle multiple separators and slashes
  if (!isUrl) {
    // First, replace any combination of separators and slashes with a single separator
    slug = slug.replace(/[-/]+/g, separator);

    // Then ensure we don't have multiple consecutive separators
    slug = slug.replace(new RegExp(`${separator}+`, "g"), separator);
  }

  // Check for trailing slash and preserve it
  const hasTrailingSlash = slug.endsWith("/");

  // Remove separator from beginning and end, but preserve a single leading/trailing slash if present
  const hasLeadingSlash = slug.startsWith("/");
  if (!isUrl) {
    slug = slug.replace(new RegExp(`^${separator}|${separator}$`, "g"), "");
  }

  // Re-add leading slash if it was present originally (only for non-URLs)
  if (!isUrl && hasLeadingSlash && !slug.startsWith("/")) {
    slug = "/" + slug;
  }

  // Re-add trailing slash if it was present originally
  if (hasTrailingSlash && !slug.endsWith("/")) {
    slug = slug + "/";
  }

  return slug;
};
