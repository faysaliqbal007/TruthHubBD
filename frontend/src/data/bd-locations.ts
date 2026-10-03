import { administrativeUpazilas } from "./bd-upazilas";

interface LocationName { id: string; name: string; nameBn: string; aliases?: string[]; }
export interface Division extends LocationName {}
export interface District extends LocationName { divisionId: string; }
export type LocationAreaKind = "upazila" | "police-thana" | "city" | "locality";
/** Kept under the historic export name for compatibility; kind describes the actual area. */
export interface Upazila extends LocationName {
  districtId: string;
  kind: LocationAreaKind;
  sourceUrl?: string;
  sourceDate?: string;
}
export interface LocationValue { divisionId?: string; districtId?: string; upazilaId?: string; }

export const divisions: Division[] = [
  {"id":"dhaka","name":"Dhaka","nameBn":"ঢাকা"},
  {"id":"chittagong","name":"Chittagong","nameBn":"চট্টগ্রাম","aliases":["Chattogram"]},
  {"id":"rajshahi","name":"Rajshahi","nameBn":"রাজশাহী"},
  {"id":"khulna","name":"Khulna","nameBn":"খুলনা"},
  {"id":"barisal","name":"Barisal","nameBn":"বরিশাল","aliases":["Barishal"]},
  {"id":"sylhet","name":"Sylhet","nameBn":"সিলেট"},
  {"id":"rangpur","name":"Rangpur","nameBn":"রংপুর"},
  {"id":"mymensingh","name":"Mymensingh","nameBn":"ময়মনসিংহ"},
];

export const districts: District[] = [
  {"id":"dhaka-district","divisionId":"dhaka","name":"Dhaka","nameBn":"ঢাকা"},
  {"id":"gazipur","divisionId":"dhaka","name":"Gazipur","nameBn":"গাজীপুর"},
  {"id":"narayanganj","divisionId":"dhaka","name":"Narayanganj","nameBn":"নারায়ণগঞ্জ"},
  {"id":"narsingdi","divisionId":"dhaka","name":"Narsingdi","nameBn":"নরসিংদী"},
  {"id":"manikganj","divisionId":"dhaka","name":"Manikganj","nameBn":"মানিকগঞ্জ"},
  {"id":"munshiganj","divisionId":"dhaka","name":"Munshiganj","nameBn":"মুন্সিগঞ্জ"},
  {"id":"tangail","divisionId":"dhaka","name":"Tangail","nameBn":"টাঙ্গাইল"},
  {"id":"kishoreganj","divisionId":"dhaka","name":"Kishoreganj","nameBn":"কিশোরগঞ্জ"},
  {"id":"faridpur","divisionId":"dhaka","name":"Faridpur","nameBn":"ফরিদপুর"},
  {"id":"rajbari","divisionId":"dhaka","name":"Rajbari","nameBn":"রাজবাড়ী"},
  {"id":"madaripur","divisionId":"dhaka","name":"Madaripur","nameBn":"মাদারীপুর"},
  {"id":"gopalganj","divisionId":"dhaka","name":"Gopalganj","nameBn":"গোপালগঞ্জ"},
  {"id":"shariatpur","divisionId":"dhaka","name":"Shariatpur","nameBn":"শরীয়তপুর"},
  {"id":"chittagong-district","divisionId":"chittagong","name":"Chittagong","nameBn":"চট্টগ্রাম","aliases":["Chattogram"]},
  {"id":"cox-bazar","divisionId":"chittagong","name":"Cox's Bazar","nameBn":"কক্সবাজার","aliases":["Coxs Bazar","Cox'sbazar","Coxsbazar"]},
  {"id":"comilla","divisionId":"chittagong","name":"Comilla","nameBn":"কুমিল্লা","aliases":["Cumilla"]},
  {"id":"chandpur","divisionId":"chittagong","name":"Chandpur","nameBn":"চাঁদপুর"},
  {"id":"feni","divisionId":"chittagong","name":"Feni","nameBn":"ফেনী"},
  {"id":"noakhali","divisionId":"chittagong","name":"Noakhali","nameBn":"নোয়াখালী"},
  {"id":"lakshmipur","divisionId":"chittagong","name":"Lakshmipur","nameBn":"লক্ষ্মীপুর"},
  {"id":"rangamati","divisionId":"chittagong","name":"Rangamati","nameBn":"রাঙামাটি"},
  {"id":"khagrachhari","divisionId":"chittagong","name":"Khagrachhari","nameBn":"খাগড়াছড়ি"},
  {"id":"bandarban","divisionId":"chittagong","name":"Bandarban","nameBn":"বান্দরবান"},
  {"id":"brahmanbaria","divisionId":"chittagong","name":"Brahmanbaria","nameBn":"ব্রাহ্মণবাড়িয়া"},
  {"id":"rajshahi-district","divisionId":"rajshahi","name":"Rajshahi","nameBn":"রাজশাহী"},
  {"id":"natore","divisionId":"rajshahi","name":"Natore","nameBn":"নাটোর"},
  {"id":"naogaon","divisionId":"rajshahi","name":"Naogaon","nameBn":"নওগাঁ"},
  {"id":"chapainawabganj","divisionId":"rajshahi","name":"Chapainawabganj","nameBn":"চাঁপাইনবাবগঞ্জ"},
  {"id":"pabna","divisionId":"rajshahi","name":"Pabna","nameBn":"পাবনা"},
  {"id":"sirajganj","divisionId":"rajshahi","name":"Sirajganj","nameBn":"সিরাজগঞ্জ"},
  {"id":"bogura","divisionId":"rajshahi","name":"Bogura","nameBn":"বগুড়া","aliases":["Bogra"]},
  {"id":"joypurhat","divisionId":"rajshahi","name":"Joypurhat","nameBn":"জয়পুরহাট"},
  {"id":"khulna-district","divisionId":"khulna","name":"Khulna","nameBn":"খুলনা"},
  {"id":"jessore","divisionId":"khulna","name":"Jessore","nameBn":"যশোর","aliases":["Jashore"]},
  {"id":"satkhira","divisionId":"khulna","name":"Satkhira","nameBn":"সাতক্ষীরা"},
  {"id":"bagerhat","divisionId":"khulna","name":"Bagerhat","nameBn":"বাগেরহাট"},
  {"id":"magura","divisionId":"khulna","name":"Magura","nameBn":"মাগুরা"},
  {"id":"narail","divisionId":"khulna","name":"Narail","nameBn":"নড়াইল"},
  {"id":"jhenaidah","divisionId":"khulna","name":"Jhenaidah","nameBn":"ঝিনাইদহ"},
  {"id":"kushtia","divisionId":"khulna","name":"Kushtia","nameBn":"কুষ্টিয়া"},
  {"id":"chuadanga","divisionId":"khulna","name":"Chuadanga","nameBn":"চুয়াডাঙ্গা"},
  {"id":"meherpur","divisionId":"khulna","name":"Meherpur","nameBn":"মেহেরপুর"},
  {"id":"barisal-district","divisionId":"barisal","name":"Barisal","nameBn":"বরিশাল","aliases":["Barishal"]},
  {"id":"bhola","divisionId":"barisal","name":"Bhola","nameBn":"ভোলা"},
  {"id":"patuakhali","divisionId":"barisal","name":"Patuakhali","nameBn":"পটুয়াখালী"},
  {"id":"pirojpur","divisionId":"barisal","name":"Pirojpur","nameBn":"পিরোজপুর"},
  {"id":"jhalokati","divisionId":"barisal","name":"Jhalokati","nameBn":"ঝালকাঠি","aliases":["Jhalakathi"]},
  {"id":"barguna","divisionId":"barisal","name":"Barguna","nameBn":"বরগুনা"},
  {"id":"sylhet-district","divisionId":"sylhet","name":"Sylhet","nameBn":"সিলেট"},
  {"id":"moulvibazar","divisionId":"sylhet","name":"Moulvibazar","nameBn":"মৌলভীবাজার","aliases":["Maulvibazar"]},
  {"id":"habiganj","divisionId":"sylhet","name":"Habiganj","nameBn":"হবিগঞ্জ"},
  {"id":"sunamganj","divisionId":"sylhet","name":"Sunamganj","nameBn":"সুনামগঞ্জ"},
  {"id":"rangpur-district","divisionId":"rangpur","name":"Rangpur","nameBn":"রংপুর"},
  {"id":"gaibandha","divisionId":"rangpur","name":"Gaibandha","nameBn":"গাইবান্ধা"},
  {"id":"kurigram","divisionId":"rangpur","name":"Kurigram","nameBn":"কুড়িগ্রাম"},
  {"id":"lalmonirhat","divisionId":"rangpur","name":"Lalmonirhat","nameBn":"লালমনিরহাট"},
  {"id":"nilphamari","divisionId":"rangpur","name":"Nilphamari","nameBn":"নীলফামারী"},
  {"id":"panchagarh","divisionId":"rangpur","name":"Panchagarh","nameBn":"পঞ্চগড়"},
  {"id":"dinajpur","divisionId":"rangpur","name":"Dinajpur","nameBn":"দিনাজপুর"},
  {"id":"thakurgaon","divisionId":"rangpur","name":"Thakurgaon","nameBn":"ঠাকুরগাঁও"},
  {"id":"mymensingh-district","divisionId":"mymensingh","name":"Mymensingh","nameBn":"ময়মনসিংহ"},
  {"id":"jamalpur","divisionId":"mymensingh","name":"Jamalpur","nameBn":"জামালপুর"},
  {"id":"netrokona","divisionId":"mymensingh","name":"Netrokona","nameBn":"নেত্রকোণা"},
  {"id":"sherpur","divisionId":"mymensingh","name":"Sherpur","nameBn":"শেরপুর"},
];

// Existing city/neighbourhood IDs remain available without being mislabelled as upazilas.
export const urbanAreas: Upazila[] = [
  {"id":"dhanmondi","districtId":"dhaka-district","name":"Dhanmondi","nameBn":"ধানমন্ডি","kind":"police-thana","sourceUrl":"https://www.police.gov.bd/en/dhaka_metropolitan_police"},
  {"id":"gulshan","districtId":"dhaka-district","name":"Gulshan","nameBn":"গুলশান","kind":"police-thana","sourceUrl":"https://www.police.gov.bd/en/dhaka_metropolitan_police"},
  {"id":"mirpur","districtId":"dhaka-district","name":"Mirpur","nameBn":"মিরপুর","kind":"locality"},
  {"id":"uttara","districtId":"dhaka-district","name":"Uttara","nameBn":"উত্তরা","kind":"locality"},
  {"id":"mohammadpur","districtId":"dhaka-district","name":"Mohammadpur","nameBn":"মোহাম্মদপুর","kind":"police-thana","sourceUrl":"https://www.police.gov.bd/en/dhaka_metropolitan_police"},
  {"id":"banani","districtId":"dhaka-district","name":"Banani","nameBn":"বনানী","kind":"police-thana","sourceUrl":"https://www.police.gov.bd/en/dhaka_metropolitan_police"},
  {"id":"motijheel","districtId":"dhaka-district","name":"Motijheel","nameBn":"মতিঝিল","kind":"police-thana","sourceUrl":"https://www.police.gov.bd/en/dhaka_metropolitan_police"},
  {"id":"panthapath","districtId":"dhaka-district","name":"Panthapath","nameBn":"পান্থপথ","kind":"locality"},
  {"id":"elephant-road","districtId":"dhaka-district","name":"Elephant Road","nameBn":"এলিফ্যান্ট রোড","kind":"locality"},
  {"id":"badda","districtId":"dhaka-district","name":"Badda","nameBn":"বাড্ডা","kind":"police-thana","sourceUrl":"https://www.police.gov.bd/en/dhaka_metropolitan_police"},
  {"id":"khilgaon","districtId":"dhaka-district","name":"Khilgaon","nameBn":"খিলগাঁও","kind":"police-thana","sourceUrl":"https://www.police.gov.bd/en/dhaka_metropolitan_police"},
  {"id":"bashundhara","districtId":"dhaka-district","name":"Bashundhara R/A","nameBn":"বসুন্ধরা আ/এ","kind":"locality"},
  {"id":"old-dhaka","districtId":"dhaka-district","name":"Old Dhaka / Lalbagh","nameBn":"পুরান ঢাকা / লালবাগ","kind":"locality"},
  {"id":"tejgaon","districtId":"dhaka-district","name":"Tejgaon","nameBn":"তেজগাঁও","kind":"police-thana","sourceUrl":"https://www.police.gov.bd/en/dhaka_metropolitan_police"},
  {"id":"ctg-city","districtId":"chittagong-district","name":"Chittagong City","nameBn":"চট্টগ্রাম সিটি","kind":"city","aliases":["Chattogram City"]},
  {"id":"rajshahi-city","districtId":"rajshahi-district","name":"Rajshahi City","nameBn":"রাজশাহী সিটি","kind":"city"},
  {"id":"khulna-city","districtId":"khulna-district","name":"Khulna City","nameBn":"খুলনা সিটি","kind":"city"},
  {"id":"sylhet-city","districtId":"sylhet-district","name":"Sylhet City","nameBn":"সিলেট সিটি","kind":"city"},
  {"id":"barisal-city","districtId":"barisal-district","name":"Barisal City","nameBn":"বরিশাল সিটি","kind":"city","aliases":["Barishal City"]},
  {"id":"rangpur-city","districtId":"rangpur-district","name":"Rangpur City","nameBn":"রংপুর সিটি","kind":"city"},
  {"id":"mymensingh-city","districtId":"mymensingh-district","name":"Mymensingh City","nameBn":"ময়মনসিংহ সিটি","kind":"city"},
];

export { administrativeUpazilas };
export const upazilas: Upazila[] = [...administrativeUpazilas, ...urbanAreas];

export const locationCoverage = {
  checkedAt: "2026-10-01",
  divisions: divisions.length,
  districts: districts.length,
  administrativeUpazilas: administrativeUpazilas.length,
  portalUpazilas: 499,
  gazetteAdditions: 4,
  policeThanas: urbanAreas.filter(area => area.kind === "police-thana").length,
  policeThanaCoverage: "partial",
  sourceUrl: "https://bangladesh.gov.bd/views/upazila-list/",
  districtSourceUrl: "https://bangladesh.gov.bd/views/district-list/",
} as const;

export function getDistricts(divisionId: string): District[] {
  return districts.filter(district => district.divisionId === divisionId);
}

/** Includes explicitly typed urban areas for compatibility with existing saved IDs. */
export function getUpazilas(districtId: string): Upazila[] {
  return upazilas.filter(area => area.districtId === districtId);
}

export function getAdministrativeUpazilas(districtId: string): Upazila[] {
  return administrativeUpazilas.filter(area => area.districtId === districtId);
}

/** Invalid parents clear their descendants instead of producing a mixed location. */
export function normalizeLocationSelection(value: LocationValue): LocationValue {
  const division = divisions.find(item => item.id === value.divisionId);
  if (!division) return {};
  const district = getDistricts(division.id).find(item => item.id === value.districtId);
  if (!district) return {divisionId: division.id};
  const area = getUpazilas(district.id).find(item => item.id === value.upazilaId);
  return {divisionId: division.id, districtId: district.id, ...(area ? {upazilaId: area.id} : {})};
}

export function formatLocation(divisionId?: string, districtId?: string, upazilaId?: string): string {
  // Keep optional-ID formatting compatible, while rejecting contradictory supplied parents.
  const division = divisions.find(item => item.id === divisionId);
  const district = districts.find(item => item.id === districtId && (!division || item.divisionId === division.id));
  const area = upazilas.find(item => item.id === upazilaId
    && (!districtId || item.districtId === district?.id)
    && (!division || districts.find(parent => parent.id === item.districtId)?.divisionId === division.id));
  return [area?.name, district?.name, division?.name].filter(Boolean).join(', ');
}

export function formatLocationBn(value: LocationValue): string {
  const valid = normalizeLocationSelection(value);
  return [upazilas.find(item => item.id === valid.upazilaId)?.nameBn,
    districts.find(item => item.id === valid.districtId)?.nameBn,
    divisions.find(item => item.id === valid.divisionId)?.nameBn].filter(Boolean).join(', ');
}

export function locationSummary(value: LocationValue, language: 'en' | 'bn'): string {
  const valid = normalizeLocationSelection(value);
  const division = divisions.find(item => item.id === valid.divisionId);
  const district = districts.find(item => item.id === valid.districtId);
  const area = upazilas.find(item => item.id === valid.upazilaId);
  return language === 'bn'
    ? [area?.nameBn, district ? `${district.nameBn} জেলা` : '', division ? `${division.nameBn} বিভাগ` : ''].filter(Boolean).join(' · ')
    : [area?.name, district ? `${district.name} District` : '', division ? `${division.name} Division` : ''].filter(Boolean).join(' · ');
}

export function locationAreaLabel(value: LocationValue): string {
  const valid = normalizeLocationSelection(value);
  const division = divisions.find(item => item.id === valid.divisionId);
  const district = districts.find(item => item.id === valid.districtId);
  const area = upazilas.find(item => item.id === valid.upazilaId);
  if (area && district) return `${area.name}, ${district.name}`;
  if (district) return `${district.name}, Bangladesh`;
  return division ? `${division.name} Division` : '';
}

export function normalizeLocationQuery(query: string): string {
  return query.normalize('NFKC').toLocaleLowerCase('en')
    .replace(/[\u200c\u200d]/g, '').replace(/[\p{P}\p{S}]/gu, ' ').replace(/\s+/g, ' ').trim();
}

export interface BDLocationSearchResult extends LocationName {
  type: 'division' | 'district' | LocationAreaKind;
  value: LocationValue;
  context: string;
  contextBn: string;
  fullLabel: string;
}

const names = (item: LocationName) => [item.name, item.nameBn, ...(item.aliases || [])];

/** English, Bangla, portal spellings, and parent names can all be combined in a query. */
export function searchBDLocations(query: string, limit = 20): BDLocationSearchResult[] {
  const normalized = normalizeLocationQuery(query);
  if (!normalized || limit < 1) return [];
  const terms = normalized.split(' ');
  const results: {result: BDLocationSearchResult; rank: number}[] = [];
  const add = (item: LocationName, type: BDLocationSearchResult['type'], value: LocationValue,
    parents: LocationName[], context: string, contextBn: string) => {
    const ownNames = names(item).map(normalizeLocationQuery);
    const searchable = [...ownNames, ...parents.flatMap(names).map(normalizeLocationQuery)].join(' ');
    if (!terms.every(term => searchable.includes(term))) return;
    const rank = ownNames.includes(normalized) ? 0 : ownNames.some(name => name.startsWith(normalized)) ? 1 : 2;
    results.push({result: {...item, type, value, context, contextBn, fullLabel: locationAreaLabel(value)}, rank});
  };
  for (const division of divisions) add(division, 'division', {divisionId: division.id}, [], 'Bangladesh', 'বাংলাদেশ');
  for (const district of districts) {
    const division = divisions.find(item => item.id === district.divisionId)!;
    add(district, 'district', {divisionId: division.id, districtId: district.id}, [division], division.name, division.nameBn);
  }
  for (const area of upazilas) {
    const district = districts.find(item => item.id === area.districtId)!;
    const division = divisions.find(item => item.id === district.divisionId)!;
    add(area, area.kind, {divisionId: division.id, districtId: district.id, upazilaId: area.id}, [district, division],
      `${district.name}, ${division.name}`, `${district.nameBn}, ${division.nameBn}`);
  }
  return results.sort((a, b) => a.rank - b.rank).slice(0, limit).map(item => item.result);
}

/** Read existing English or Bangla labels without changing their stable location IDs. */
export function locationSelectionFromLabel(label: string): LocationValue {
  const parts = label.split(',').map(part => part.trim());
  const first = parts[0].replace(/ District \(All Upazilas\)$| Division$| বিভাগ$| জেলা \(সব উপজেলা\)$/g, '');
  const exact = (item: LocationName, text: string) => names(item).some(name => normalizeLocationQuery(name) === normalizeLocationQuery(text));
  const districtContext = districts.find(item => parts.slice(1).some(part => exact(item, part)));
  const area = upazilas.find(item => exact(item, first) && (!districtContext || item.districtId === districtContext.id));
  if (area) {
    const district = districts.find(item => item.id === area.districtId)!;
    return {divisionId: district.divisionId, districtId: district.id, upazilaId: area.id};
  }
  if (/ Division$| বিভাগ$/.test(parts[0])) return {divisionId: divisions.find(item => exact(item, first))?.id};
  const district = districts.find(item => exact(item, first));
  if (district) return {divisionId: district.divisionId, districtId: district.id};
  const division = divisions.find(item => exact(item, first));
  return division ? {divisionId: division.id} : {};
}
