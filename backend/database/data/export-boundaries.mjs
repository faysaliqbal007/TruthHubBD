import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDataDir = path.resolve(__dirname, '../../../frontend/src/data');

// Read files
const bdLocText = fs.readFileSync(path.join(frontendDataDir, 'bd-locations.ts'), 'utf8');
const bdUpzText = fs.readFileSync(path.join(frontendDataDir, 'bd-upazilas.ts'), 'utf8');

function extractArray(content, varName) {
  const regex = new RegExp(`export const ${varName}(?::\\s*[^=]+)?\\s*=\\s*(\\[[\\s\\S]*?\\n\\]);`);
  const match = content.match(regex);
  if (!match) throw new Error(`Could not find ${varName}`);
  return (new Function(`return ${match[1]}`))();
}

try {
  const divisions = extractArray(bdLocText, 'divisions');
  const districts = extractArray(bdLocText, 'districts');
  const urbanAreas = extractArray(bdLocText, 'urbanAreas');
  const administrativeUpazilas = extractArray(bdUpzText, 'administrativeUpazilas');

  const combined = {
    divisions,
    districts,
    urbanAreas,
    administrativeUpazilas
  };

  const outFile = path.join(__dirname, 'bd-boundaries.json');
  fs.writeFileSync(outFile, JSON.stringify(combined, null, 2), 'utf8');
  console.log(`Successfully exported bd-boundaries.json: ${divisions.length} divisions, ${districts.length} districts, ${urbanAreas.length} urban areas, ${administrativeUpazilas.length} upazilas.`);
} catch (err) {
  console.error('Export failed:', err);
  process.exit(1);
}
