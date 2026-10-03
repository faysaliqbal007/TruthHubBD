import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

// Compile the two pure data modules in memory using the app's actual TypeScript compiler.
// The browser uses extensionless imports, so a data URL resolves the single module edge.
const compile = source => ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022},
}).outputText;
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const upazilaCode = compile(await readFile(new URL('../src/data/bd-upazilas.ts', import.meta.url), 'utf8'));
const locationCode = compile(await readFile(new URL('../src/data/bd-locations.ts', import.meta.url), 'utf8'))
  .replace(/(['"])\.\/bd-upazilas\1/, JSON.stringify(moduleUrl(upazilaCode)));
const {
  divisions, districts, upazilas, administrativeUpazilas, urbanAreas, locationCoverage,
  getDistricts, getUpazilas, normalizeLocationSelection, formatLocation,
  searchBDLocations, locationSelectionFromLabel, locationSummary,
} = await import(moduleUrl(locationCode));
const legacy = JSON.parse(await readFile(new URL('./fixtures/legacy-location-ids.json', import.meta.url), 'utf8'));

test('source snapshot covers every division and district with valid unique parent relations', () => {
  assert.equal(divisions.length, 8);
  assert.equal(districts.length, 64);
  assert.equal(administrativeUpazilas.length, 503);
  assert.equal(locationCoverage.portalUpazilas, 499);
  assert.equal(locationCoverage.gazetteAdditions, 4);
  assert.equal(new Set(upazilas.map(area => area.id)).size, upazilas.length);
  for (const division of divisions) assert.ok(getDistricts(division.id).length > 0);
  for (const district of districts) {
    assert.ok(divisions.some(division => division.id === district.divisionId));
    assert.ok(administrativeUpazilas.some(area => area.districtId === district.id), district.id);
  }
  for (const area of upazilas) assert.ok(districts.some(district => district.id === area.districtId), area.id);
  for (const area of administrativeUpazilas) {
    assert.equal(area.kind, 'upazila');
    assert.match(area.sourceUrl, /^https:\/\/[a-z0-9.-]+\.gov\.bd(?:\/|$)/);
    assert.equal('lat' in area || 'lng' in area, false);
  }
});

test('all 108 existing local-area IDs retain their original district', () => {
  assert.equal(legacy.length, 108);
  for (const record of legacy) {
    const area = upazilas.find(area => area.id === record.id);
    assert.ok(area, record.id);
    assert.equal(area.districtId, record.districtId, record.id);
  }
  assert.equal(formatLocation('dhaka', 'dhaka-district', 'dhanmondi'), 'Dhanmondi, Dhaka, Dhaka');
  assert.equal(formatLocation(undefined, 'gazipur'), 'Gazipur');
  assert.equal(formatLocation(undefined, undefined, 'savar'), 'Savar');
  assert.equal(locationSummary({divisionId: 'dhaka', districtId: 'dhaka-district', upazilaId: 'savar'}, 'en'), 'Savar · Dhaka District · Dhaka Division');
});

test('server validation snapshot matches the frontend hierarchy and IDs exactly', async () => {
  const server = JSON.parse(await readFile(new URL('../../backend/resources/data/bd-locations.json', import.meta.url), 'utf8'));
  assert.deepEqual(server.divisions, divisions);
  assert.deepEqual(server.districts, districts);
  assert.deepEqual(server.upazilas, upazilas);
  assert.equal(server.coverage.administrativeUpazilas, administrativeUpazilas.length);
});

test('administrative upazilas, police thanas and broad urban labels are separate', () => {
  assert.equal(upazilas.find(area => area.id === 'savar').kind, 'upazila');
  assert.equal(upazilas.find(area => area.id === 'dhanmondi').kind, 'police-thana');
  assert.equal(upazilas.find(area => area.id === 'uttara').kind, 'locality');
  assert.equal(upazilas.find(area => area.id === 'ctg-city').kind, 'city');
  assert.equal(urbanAreas.length, 21);
  assert.equal(locationCoverage.policeThanas, 8);
  assert.equal(locationCoverage.policeThanaCoverage, 'partial');
});

test('invalid parent changes clear stale districts and local areas', () => {
  const valid = {divisionId: 'dhaka', districtId: 'dhaka-district', upazilaId: 'savar'};
  assert.deepEqual(normalizeLocationSelection(valid), valid);
  assert.deepEqual(normalizeLocationSelection({...valid, divisionId: 'sylhet'}), {divisionId: 'sylhet'});
  assert.deepEqual(normalizeLocationSelection({...valid, districtId: 'gazipur'}), {divisionId: 'dhaka', districtId: 'gazipur'});
  assert.deepEqual(normalizeLocationSelection({...valid, upazilaId: 'not-a-real-area'}), {divisionId: 'dhaka', districtId: 'dhaka-district'});
  assert.deepEqual(normalizeLocationSelection({...valid, divisionId: 'not-a-real-division'}), {});
  assert.deepEqual(normalizeLocationSelection({districtId: 'dhaka-district', upazilaId: 'savar'}), {});
  assert.equal(formatLocation('sylhet', 'dhaka-district', 'savar'), 'Sylhet');
});

test('English, Bangla, alternate spellings and combined parent searches resolve valid locations', () => {
  for (const query of ['Savar', 'সাভার']) assert.equal(searchBDLocations(query)[0].id, 'savar');
  for (const [query, expected] of [['Chattogram', 'chittagong'], ['Cumilla', 'comilla'], ['Jashore', 'jessore'], ['Barishal', 'barisal']]) {
    assert.ok(searchBDLocations(query).some(result => result.id === expected), query);
  }
  assert.ok(searchBDLocations('Mirpur Kushtia').some(result => result.value.districtId === 'kushtia' && result.type === 'upazila'));
  assert.ok(searchBDLocations('মিরপুর কুষ্টিয়া').some(result => result.value.districtId === 'kushtia'));
  assert.ok(searchBDLocations('Indurkani').some(result => result.name === 'Zianagar'));
  for (const query of ['ঢাকা', 'Sylhet', 'গফরগাঁও', 'Matamuhuri']) {
    for (const result of searchBDLocations(query)) assert.deepEqual(normalizeLocationSelection(result.value), result.value);
  }
  assert.deepEqual(searchBDLocations('   '), []);
});

test('saved labels resolve to stable IDs including modern spelling aliases', () => {
  assert.deepEqual(locationSelectionFromLabel('Dhanmondi, Dhaka'), {divisionId: 'dhaka', districtId: 'dhaka-district', upazilaId: 'dhanmondi'});
  assert.deepEqual(locationSelectionFromLabel('ধানমন্ডি, ঢাকা'), {divisionId: 'dhaka', districtId: 'dhaka-district', upazilaId: 'dhanmondi'});
  assert.deepEqual(locationSelectionFromLabel('Chattogram Division'), {divisionId: 'chittagong'});
  assert.deepEqual(locationSelectionFromLabel('Gazipur District (All Upazilas)'), {divisionId: 'dhaka', districtId: 'gazipur'});
  assert.deepEqual(locationSelectionFromLabel('Online Only'), {});
  assert.deepEqual(locationSelectionFromLabel('All Bangladesh'), {});
});

test('four additions missing from portal retain exact gazette URLs and dates', () => {
  const additions = administrativeUpazilas.filter(area => area.sourceDate);
  assert.equal(additions.length, 4);
  for (const addition of additions) {
    assert.match(addition.sourceUrl, /^https:\/\/www\.dpp\.gov\.bd\/upload_file\/gazettes\/\d+_\d+\.pdf$/);
    assert.match(addition.sourceDate, /^2026-(05|07)-\d\d$/);
  }
});
