
// @ts-nocheck
// @ts-nocheck
import fs from 'fs';
import path from 'path';

// Paths
const DATA_DIR = path.join(process.cwd(), '資料JSON檔');
const SOURCE_FILE = path.join(DATA_DIR, 'data_structured_final_1216.json');
const BACKUP_FILE = path.join(DATA_DIR, 'data_structured_final_1216.backup.json');
const MAPPING_FILE = path.join(process.cwd(), 'data', 'url_mapping.json');

async function merge() {
  console.log('🚀 Starting Data Merge...');

  // 1. Validation
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`❌ Source file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }
  if (!fs.existsSync(MAPPING_FILE)) {
    console.error(`❌ Mapping file not found: ${MAPPING_FILE}`);
    process.exit(1);
  }

  // 2. Load Data
  console.log('📖 Reading files...');
  const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf-8');
  const sourceData = JSON.parse(sourceContent);
  const mappingData = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));

  const schools = sourceData.schools || (Array.isArray(sourceData) ? sourceData : [sourceData]);
  console.log(`ℹ️  Found ${schools.length} schools in source.`);
  console.log(`ℹ️  Found ${Object.keys(mappingData).length} image URLs in mapping.`);

  // 3. Backup
  console.log('💾 Creating backup...');
  fs.writeFileSync(BACKUP_FILE, sourceContent); // Write original content
  console.log(`✅ Backup saved to: ${BACKUP_FILE}`);

  // 4. Merge
  console.log('🔄 Merging data...');
  let updatedCount = 0;
  
  for (const school of schools) {
      if (mappingData[school.school_id]) {
          // Verify it's actually an update (ignore if same)
          const newUrl = mappingData[school.school_id];
          const oldUrl = school.school_images?.[0];

          if (newUrl !== oldUrl) {
              school.school_images = [newUrl];
              updatedCount++;
          }
      }
  }

  // 5. Save
  if (updatedCount > 0) {
      console.log(`💾 Saving updated data (${updatedCount} changes)...`);
      // Use null, 2 for pretty printing to maintain readability
      fs.writeFileSync(SOURCE_FILE, JSON.stringify(sourceData, null, 2));
      console.log('✅ Successfully updated source file!');
  } else {
      console.log('⚠️  No changes needed. File matches mapping.');
  }
}

merge().catch(console.error);
