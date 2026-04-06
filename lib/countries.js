// Country code → { name, flag emoji }
export const COUNTRIES = {
  AR: { name: "Argentina",   flag: "🇦🇷" },
  BO: { name: "Bolivia",     flag: "🇧🇴" },
  BR: { name: "Brazil",      flag: "🇧🇷" },
  CA: { name: "Canada",      flag: "🇨🇦" },
  CL: { name: "Chile",       flag: "🇨🇱" },
  CO: { name: "Colombia",    flag: "🇨🇴" },
  CR: { name: "Costa Rica",  flag: "🇨🇷" },
  EC: { name: "Ecuador",     flag: "🇪🇨" },
  ES: { name: "Spain",       flag: "🇪🇸" },
  GT: { name: "Guatemala",   flag: "🇬🇹" },
  HN: { name: "Honduras",    flag: "🇭🇳" },
  MX: { name: "Mexico",      flag: "🇲🇽" },
  NI: { name: "Nicaragua",   flag: "🇳🇮" },
  PA: { name: "Panama",      flag: "🇵🇦" },
  PE: { name: "Peru",        flag: "🇵🇪" },
  PY: { name: "Paraguay",    flag: "🇵🇾" },
  SV: { name: "El Salvador", flag: "🇸🇻" },
  US: { name: "USA",         flag: "🇺🇸" },
  UY: { name: "Uruguay",     flag: "🇺🇾" },
  VE: { name: "Venezuela",   flag: "🇻🇪" },
};

export function getCountry(code) {
  return COUNTRIES[code] || { name: code || "Unknown", flag: "🌐" };
}
