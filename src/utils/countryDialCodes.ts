/**
 * Indicatifs téléphoniques + code ISO2 par pays, indexés sur le nom anglais tel
 * que renvoyé par l'API countriesnow (voir `@/api/geo/countriesNow.api`).
 * Utilisé pour le sélecteur "drapeau" du champ téléphone : le drapeau est dérivé
 * du code ISO2, et l'indicatif est préfixé automatiquement au numéro
 * (ex. Tunisie -> +216).
 */
export interface CountryPhoneInfo {
  dialCode: string;
  iso2: string;
  /** Longueur attendue du numéro local (hors indicatif), ex. 8 pour la Tunisie. */
  length: number;
}

export const COUNTRY_PHONE_INFO: Record<string, CountryPhoneInfo> = {
  Afghanistan: { dialCode: "+93", iso2: "AF", length: 9 },
  Albania: { dialCode: "+355", iso2: "AL", length: 9 },
  Algeria: { dialCode: "+213", iso2: "DZ", length: 9 },
  Andorra: { dialCode: "+376", iso2: "AD", length: 6 },
  Angola: { dialCode: "+244", iso2: "AO", length: 9 },
  Argentina: { dialCode: "+54", iso2: "AR", length: 10 },
  Armenia: { dialCode: "+374", iso2: "AM", length: 8 },
  Australia: { dialCode: "+61", iso2: "AU", length: 9 },
  Austria: { dialCode: "+43", iso2: "AT", length: 10 },
  Azerbaijan: { dialCode: "+994", iso2: "AZ", length: 9 },
  Bahrain: { dialCode: "+973", iso2: "BH", length: 8 },
  Bangladesh: { dialCode: "+880", iso2: "BD", length: 10 },
  Belarus: { dialCode: "+375", iso2: "BY", length: 9 },
  Belgium: { dialCode: "+32", iso2: "BE", length: 9 },
  Benin: { dialCode: "+229", iso2: "BJ", length: 8 },
  Bolivia: { dialCode: "+591", iso2: "BO", length: 8 },
  "Bosnia and Herzegovina": { dialCode: "+387", iso2: "BA", length: 8 },
  Botswana: { dialCode: "+267", iso2: "BW", length: 8 },
  Brazil: { dialCode: "+55", iso2: "BR", length: 11 },
  Bulgaria: { dialCode: "+359", iso2: "BG", length: 9 },
  "Burkina Faso": { dialCode: "+226", iso2: "BF", length: 8 },
  Burundi: { dialCode: "+257", iso2: "BI", length: 8 },
  Cambodia: { dialCode: "+855", iso2: "KH", length: 9 },
  Cameroon: { dialCode: "+237", iso2: "CM", length: 9 },
  Canada: { dialCode: "+1", iso2: "CA", length: 10 },
  "Central African Republic": { dialCode: "+236", iso2: "CF", length: 8 },
  Chad: { dialCode: "+235", iso2: "TD", length: 8 },
  Chile: { dialCode: "+56", iso2: "CL", length: 9 },
  China: { dialCode: "+86", iso2: "CN", length: 11 },
  Colombia: { dialCode: "+57", iso2: "CO", length: 10 },
  Comoros: { dialCode: "+269", iso2: "KM", length: 7 },
  Congo: { dialCode: "+242", iso2: "CG", length: 9 },
  "Costa Rica": { dialCode: "+506", iso2: "CR", length: 8 },
  Croatia: { dialCode: "+385", iso2: "HR", length: 9 },
  Cuba: { dialCode: "+53", iso2: "CU", length: 8 },
  Cyprus: { dialCode: "+357", iso2: "CY", length: 8 },
  "Czech Republic": { dialCode: "+420", iso2: "CZ", length: 9 },
  Denmark: { dialCode: "+45", iso2: "DK", length: 8 },
  Djibouti: { dialCode: "+253", iso2: "DJ", length: 8 },
  "Dominican Republic": { dialCode: "+1", iso2: "DO", length: 10 },
  Ecuador: { dialCode: "+593", iso2: "EC", length: 9 },
  Egypt: { dialCode: "+20", iso2: "EG", length: 10 },
  "El Salvador": { dialCode: "+503", iso2: "SV", length: 8 },
  Estonia: { dialCode: "+372", iso2: "EE", length: 8 },
  Ethiopia: { dialCode: "+251", iso2: "ET", length: 9 },
  Finland: { dialCode: "+358", iso2: "FI", length: 9 },
  France: { dialCode: "+33", iso2: "FR", length: 9 },
  Gabon: { dialCode: "+241", iso2: "GA", length: 8 },
  Gambia: { dialCode: "+220", iso2: "GM", length: 7 },
  Georgia: { dialCode: "+995", iso2: "GE", length: 9 },
  Germany: { dialCode: "+49", iso2: "DE", length: 10 },
  Ghana: { dialCode: "+233", iso2: "GH", length: 9 },
  Greece: { dialCode: "+30", iso2: "GR", length: 10 },
  Guatemala: { dialCode: "+502", iso2: "GT", length: 8 },
  Guinea: { dialCode: "+224", iso2: "GN", length: 9 },
  "Guinea-Bissau": { dialCode: "+245", iso2: "GW", length: 7 },
  Haiti: { dialCode: "+509", iso2: "HT", length: 8 },
  Honduras: { dialCode: "+504", iso2: "HN", length: 8 },
  Hungary: { dialCode: "+36", iso2: "HU", length: 9 },
  Iceland: { dialCode: "+354", iso2: "IS", length: 7 },
  India: { dialCode: "+91", iso2: "IN", length: 10 },
  Indonesia: { dialCode: "+62", iso2: "ID", length: 10 },
  Iran: { dialCode: "+98", iso2: "IR", length: 10 },
  Iraq: { dialCode: "+964", iso2: "IQ", length: 10 },
  Ireland: { dialCode: "+353", iso2: "IE", length: 9 },
  Israel: { dialCode: "+972", iso2: "IL", length: 9 },
  Italy: { dialCode: "+39", iso2: "IT", length: 10 },
  "Ivory Coast": { dialCode: "+225", iso2: "CI", length: 10 },
  Jamaica: { dialCode: "+1", iso2: "JM", length: 10 },
  Japan: { dialCode: "+81", iso2: "JP", length: 10 },
  Jordan: { dialCode: "+962", iso2: "JO", length: 9 },
  Kazakhstan: { dialCode: "+7", iso2: "KZ", length: 10 },
  Kenya: { dialCode: "+254", iso2: "KE", length: 9 },
  Kuwait: { dialCode: "+965", iso2: "KW", length: 8 },
  Kyrgyzstan: { dialCode: "+996", iso2: "KG", length: 9 },
  Laos: { dialCode: "+856", iso2: "LA", length: 8 },
  Latvia: { dialCode: "+371", iso2: "LV", length: 8 },
  Lebanon: { dialCode: "+961", iso2: "LB", length: 8 },
  Lesotho: { dialCode: "+266", iso2: "LS", length: 8 },
  Liberia: { dialCode: "+231", iso2: "LR", length: 8 },
  Libya: { dialCode: "+218", iso2: "LY", length: 9 },
  Liechtenstein: { dialCode: "+423", iso2: "LI", length: 7 },
  Lithuania: { dialCode: "+370", iso2: "LT", length: 8 },
  Luxembourg: { dialCode: "+352", iso2: "LU", length: 9 },
  Madagascar: { dialCode: "+261", iso2: "MG", length: 9 },
  Malawi: { dialCode: "+265", iso2: "MW", length: 9 },
  Malaysia: { dialCode: "+60", iso2: "MY", length: 9 },
  Maldives: { dialCode: "+960", iso2: "MV", length: 7 },
  Mali: { dialCode: "+223", iso2: "ML", length: 8 },
  Malta: { dialCode: "+356", iso2: "MT", length: 8 },
  Mauritania: { dialCode: "+222", iso2: "MR", length: 8 },
  Mauritius: { dialCode: "+230", iso2: "MU", length: 8 },
  Mexico: { dialCode: "+52", iso2: "MX", length: 10 },
  Moldova: { dialCode: "+373", iso2: "MD", length: 8 },
  Monaco: { dialCode: "+377", iso2: "MC", length: 8 },
  Mongolia: { dialCode: "+976", iso2: "MN", length: 8 },
  Montenegro: { dialCode: "+382", iso2: "ME", length: 8 },
  Morocco: { dialCode: "+212", iso2: "MA", length: 9 },
  Mozambique: { dialCode: "+258", iso2: "MZ", length: 9 },
  Myanmar: { dialCode: "+95", iso2: "MM", length: 9 },
  Namibia: { dialCode: "+264", iso2: "NA", length: 9 },
  Nepal: { dialCode: "+977", iso2: "NP", length: 10 },
  Netherlands: { dialCode: "+31", iso2: "NL", length: 9 },
  "New Zealand": { dialCode: "+64", iso2: "NZ", length: 9 },
  Nicaragua: { dialCode: "+505", iso2: "NI", length: 8 },
  Niger: { dialCode: "+227", iso2: "NE", length: 8 },
  Nigeria: { dialCode: "+234", iso2: "NG", length: 10 },
  "North Korea": { dialCode: "+850", iso2: "KP", length: 10 },
  "North Macedonia": { dialCode: "+389", iso2: "MK", length: 8 },
  Norway: { dialCode: "+47", iso2: "NO", length: 8 },
  Oman: { dialCode: "+968", iso2: "OM", length: 8 },
  Pakistan: { dialCode: "+92", iso2: "PK", length: 10 },
  Palestine: { dialCode: "+970", iso2: "PS", length: 9 },
  Panama: { dialCode: "+507", iso2: "PA", length: 8 },
  "Papua New Guinea": { dialCode: "+675", iso2: "PG", length: 8 },
  Paraguay: { dialCode: "+595", iso2: "PY", length: 9 },
  Peru: { dialCode: "+51", iso2: "PE", length: 9 },
  Philippines: { dialCode: "+63", iso2: "PH", length: 10 },
  Poland: { dialCode: "+48", iso2: "PL", length: 9 },
  Portugal: { dialCode: "+351", iso2: "PT", length: 9 },
  Qatar: { dialCode: "+974", iso2: "QA", length: 8 },
  Romania: { dialCode: "+40", iso2: "RO", length: 9 },
  Russia: { dialCode: "+7", iso2: "RU", length: 10 },
  Rwanda: { dialCode: "+250", iso2: "RW", length: 9 },
  "Saudi Arabia": { dialCode: "+966", iso2: "SA", length: 9 },
  Senegal: { dialCode: "+221", iso2: "SN", length: 9 },
  Serbia: { dialCode: "+381", iso2: "RS", length: 9 },
  Seychelles: { dialCode: "+248", iso2: "SC", length: 7 },
  "Sierra Leone": { dialCode: "+232", iso2: "SL", length: 8 },
  Singapore: { dialCode: "+65", iso2: "SG", length: 8 },
  Slovakia: { dialCode: "+421", iso2: "SK", length: 9 },
  Slovenia: { dialCode: "+386", iso2: "SI", length: 8 },
  Somalia: { dialCode: "+252", iso2: "SO", length: 8 },
  "South Africa": { dialCode: "+27", iso2: "ZA", length: 9 },
  "South Korea": { dialCode: "+82", iso2: "KR", length: 10 },
  "South Sudan": { dialCode: "+211", iso2: "SS", length: 9 },
  Spain: { dialCode: "+34", iso2: "ES", length: 9 },
  "Sri Lanka": { dialCode: "+94", iso2: "LK", length: 9 },
  Sudan: { dialCode: "+249", iso2: "SD", length: 9 },
  Sweden: { dialCode: "+46", iso2: "SE", length: 9 },
  Switzerland: { dialCode: "+41", iso2: "CH", length: 9 },
  Syria: { dialCode: "+963", iso2: "SY", length: 9 },
  Taiwan: { dialCode: "+886", iso2: "TW", length: 9 },
  Tajikistan: { dialCode: "+992", iso2: "TJ", length: 9 },
  Tanzania: { dialCode: "+255", iso2: "TZ", length: 9 },
  Thailand: { dialCode: "+66", iso2: "TH", length: 9 },
  Togo: { dialCode: "+228", iso2: "TG", length: 8 },
  Tunisia: { dialCode: "+216", iso2: "TN", length: 8 },
  Turkey: { dialCode: "+90", iso2: "TR", length: 10 },
  Turkmenistan: { dialCode: "+993", iso2: "TM", length: 8 },
  Uganda: { dialCode: "+256", iso2: "UG", length: 9 },
  Ukraine: { dialCode: "+380", iso2: "UA", length: 9 },
  "United Arab Emirates": { dialCode: "+971", iso2: "AE", length: 9 },
  "United Kingdom": { dialCode: "+44", iso2: "GB", length: 10 },
  "United States": { dialCode: "+1", iso2: "US", length: 10 },
  Uruguay: { dialCode: "+598", iso2: "UY", length: 8 },
  Uzbekistan: { dialCode: "+998", iso2: "UZ", length: 9 },
  Venezuela: { dialCode: "+58", iso2: "VE", length: 10 },
  Vietnam: { dialCode: "+84", iso2: "VN", length: 9 },
  Yemen: { dialCode: "+967", iso2: "YE", length: 9 },
  Zambia: { dialCode: "+260", iso2: "ZM", length: 9 },
  Zimbabwe: { dialCode: "+263", iso2: "ZW", length: 9 },
};

/** Retourne l'indicatif du pays (ex. "+216"), ou "" si inconnu. */
export function getDialCode(countryName: string | undefined | null): string {
  if (!countryName) return "";
  return COUNTRY_PHONE_INFO[countryName.trim()]?.dialCode ?? "";
}

/** Longueur attendue du numéro local pour ce pays (ex. 8 pour la Tunisie), 8 par défaut si inconnu. */
export function getPhoneLength(countryName: string | undefined | null): number {
  if (!countryName) return 8;
  return COUNTRY_PHONE_INFO[countryName.trim()]?.length ?? 8;
}

/** Valide que le numéro local (chiffres uniquement) a la longueur attendue pour le pays choisi. */
export function validatePhoneForCountry(phone: string | undefined, countryName: string | undefined | null): boolean {
  if (!phone) return false;
  const trimmed = phone.trim();
  const expectedLength = getPhoneLength(countryName);
  return new RegExp(`^[0-9]{${expectedLength}}$`).test(trimmed);
}

/** Convertit un code ISO2 (ex. "TN") en emoji drapeau (🇹🇳) via les indicateurs régionaux Unicode. */
export function isoToFlagEmoji(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return "🏳️";
  const codePoints = iso2
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/** Retourne l'emoji drapeau du pays, ou un drapeau blanc générique si inconnu. */
export function getFlagEmoji(countryName: string | undefined | null): string {
  if (!countryName) return "🏳️";
  const iso2 = COUNTRY_PHONE_INFO[countryName.trim()]?.iso2;
  return iso2 ? isoToFlagEmoji(iso2) : "🏳️";
}
