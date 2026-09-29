/**
 * Default mapping from the community names used on the site to the names DLD
 * uses in its open data (AREA_EN is the official land-registry area;
 * MASTER_PROJECT_EN is the developer's master community). Admins can edit these
 * per community in Admin → Rent benchmarks → "DLD area names".
 */
export const DEFAULT_DLD_ALIASES: Record<string, string[]> = {
  'Downtown Dubai': ['Downtown Dubai', 'Burj Khalifa'],
  'Dubai Marina': ['Dubai Marina', 'Marsa Dubai'],
  'Palm Jumeirah': ['Palm Jumeirah', 'Nakhlat Jumeira'],
  'Business Bay': ['Business Bay'],
  'Jumeirah Village Circle (JVC)': ['Jumeirah Village Circle', 'Al Barsha South Fourth'],
  'Dubai Hills Estate': ['Dubai Hills Estate', 'Dubai Hills', 'Hadaeq Sheikh Mohammed Bin Rashid'],
  'Dubai Creek Harbour': ['Dubai Creek Harbour', 'Al Khairan First'],
  'Dubai South': ['Dubai South', 'Madinat Al Mataar'],
  'Arabian Ranches': ['Arabian Ranches', 'Wadi Al Safa 6'],
  'DAMAC Hills': ['DAMAC Hills', 'Al Hebiah Fourth'],
  'Motor City': ['Motor City', 'Al Hebiah First'],
  'Meydan': ['Meydan', 'Meydan One', 'Nadd Al Shiba First'],
  'MBK City': ['Mohammed Bin Rashid City', 'MBR City', 'Al Merkadh'],
};

/** Lower-case, punctuation-free key used for matching DLD names. */
export function areaKey(name: string | null | undefined): string {
  return String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
