import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../../backend/resources/data/bd-locations.json', import.meta.url), 'utf8'));
const ids = records => new Set(records.map(record => record.id));
const divisionIds = ids(data.divisions), districtIds = ids(data.districts), areaIds = ids(data.upazilas);
assert.equal(divisionIds.size, 8);
assert.equal(districtIds.size, 64);
assert.equal(areaIds.size, data.upazilas.length);
for (const district of data.districts) assert.ok(divisionIds.has(district.divisionId), district.id);
for (const area of data.upazilas) assert.ok(districtIds.has(area.districtId), area.id);
const administrative = data.upazilas.filter(area => area.kind === 'upazila');
for (const district of data.districts) assert.ok(administrative.some(area => area.districtId === district.id), district.id);
const portalRecords = administrative.filter(area => !area.sourceDate);
const additions = administrative.filter(area => area.sourceDate);
assert.equal(portalRecords.length, data.coverage.portalUpazilas);
assert.equal(additions.length, data.coverage.gazetteAdditions);

if (process.argv.includes('--live')) {
  const sourceUrl = data.sourceUrls[0];
  const response = await fetch(sourceUrl, {signal: AbortSignal.timeout(30000)});
  assert.ok(response.ok, `Official source HTTP ${response.status}`);
  const html = await response.text();
  const rows = [...html.matchAll(/<tr class="division-row">([\s\S]*?)<\/tr>/g)];
  assert.equal(rows.length, 64, 'Official source district row count changed; review before refreshing data');
  const domainToDistrict = {
    dhaka: 'dhaka-district', chattogram: 'chittagong-district', rajshahi: 'rajshahi-district',
    khulna: 'khulna-district', sylhet: 'sylhet-district', barisal: 'barisal-district',
    rangpur: 'rangpur-district', mymensingh: 'mymensingh-district', jashore: 'jessore',
    jhalakathi: 'jhalokati', coxsbazar: 'cox-bazar', bogra: 'bogura',
  };
  const sections = [...html.matchAll(/<h4>\s*(.*?)<\/h4>\s*<table class="district-table">([\s\S]*?)<\/table>/g)];
  assert.equal(sections.length, 8, 'Official division grouping changed');
  for (const [_, header, section] of sections) {
    const nameBn = header.replace(/ বিভাগ$/, '').trim().normalize('NFKC');
    const division = data.divisions.find(item => item.nameBn.normalize('NFKC') === nameBn);
    assert.ok(division, `Unknown source division ${header}`);
    for (const row of section.matchAll(/<td class="district-name">\s*<a href="([^"]+)"/g)) {
      const domain = new URL(row[1]).hostname.split('.')[0];
      const districtId = domainToDistrict[domain] || domain;
      const district = data.districts.find(item => item.id === districtId);
      assert.ok(district, districtId);
      assert.equal(district.divisionId, division.id, `Division mismatch for ${districtId}`);
    }
  }
  const published = new Map();
  for (const [_, row] of rows) {
    const districtUrl = row.match(/<td class="district-name">\s*<a href="([^"]+)"/)[1];
    const domain = new URL(districtUrl).hostname.split('.')[0];
    const districtId = domainToDistrict[domain] || domain;
    for (const link of row.matchAll(/<li>\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
      assert.equal(published.has(link[1]), false, `Duplicate source URL ${link[1]}`);
      published.set(link[1], {districtId, nameBn: link[2].replace(/উপজেলা/g, '').split(',')[0].trim()});
    }
  }
  assert.equal(published.size, portalRecords.length, 'Official portal snapshot has changed; manually review new or removed records');
  for (const record of portalRecords) {
    const publishedRecord = published.get(record.sourceUrl);
    assert.ok(publishedRecord, `Source no longer contains ${record.sourceUrl}`);
    assert.equal(record.districtId, publishedRecord.districtId, record.id);
    assert.equal(record.nameBn, publishedRecord.nameBn, record.id);
  }
  console.log(`Official portal verified: ${sections.length} divisions, ${rows.length} districts, ${published.size} unique upazila links, no missing records or parent mismatches.`);
}
console.log(`Local snapshot verified: ${data.divisions.length} divisions, ${data.districts.length} districts, ${administrative.length} administrative upazilas (${portalRecords.length} portal + ${additions.length} exact gazette additions), ${data.upazilas.length - administrative.length} typed urban areas. Police-thana coverage is partial.`);
