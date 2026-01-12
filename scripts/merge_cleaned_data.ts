import fs from 'fs';
import path from 'path';

const BASE_FILE = path.join(process.cwd(), '資料JSON檔', 'data_structured_COMPLETE.json');
const CLEANED_DIR = path.join(process.cwd(), '資料JSON檔', 'cleaned_data');
const OUTPUT_FILE = path.join(process.cwd(), '資料JSON檔', 'data_structured_MERGED.json');

// Priority files to load
const FILES_TO_MERGE = [
  { file: '114_personal_application_FIXED.json', year: '114', type: 'personal_application' },
  { file: '114_distribution_FIXED.json', year: '114', type: 'distribution_admission' },
  { file: '114_star_plan_FIXED.json', year: '114', type: 'star_plan' },
  { file: '115_personal_application_cleaned.json', year: '115', type: 'personal_application' },
  { file: '115_star_plan_cleaned.json', year: '115', type: 'star_plan' }
];

async function main() {
  console.log('Loading base data...');
  const baseData = JSON.parse(fs.readFileSync(BASE_FILE, 'utf-8'));
  const schools = baseData.schools;

  // Create a quick lookup map: "SchoolName|DeptName" -> Dept Object Reference
  const deptLookup = new Map();
  let totalDepts = 0;

  schools.forEach((school: any) => {
    if (school.departments) {
      school.departments.forEach((dept: any) => {
        const key = `${school.school_name}|${dept.department_name}`;
        // Also try matching without parsing unique ID if names are strictly consistent
        // But cleaned data uses keys like "Details...". check file format.
        // The view_file previously showed: "國立臺灣大學|中國文學系": { ... }
        deptLookup.set(key, dept);
        totalDepts++;
      });
    }
  });

  console.log(`Indexed ${totalDepts} departments for matching.`);

  for (const config of FILES_TO_MERGE) {
    const filePath = path.join(CLEANED_DIR, config.file);
    if (!fs.existsSync(filePath)) {
        console.warn(`Skipping missing file: ${config.file}`);
        continue;
    }

    console.log(`Merging ${config.file}...`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceMap = JSON.parse(content);

    let matchCount = 0;
    
    // entries are like: "Key": { school_name, department_name, [type]: {...} }
    for (const [key, validEntry] of Object.entries(sourceMap)) {
       const entry = validEntry as any;
       // We rely on consistent naming. 
       // Cleaned data uses formatted keys, let's try strict name match.
       const lookupKey = `${entry.school_name}|${entry.department_name}`;
       const targetDept = deptLookup.get(lookupKey);

       if (targetDept) {
           // Ensure structure exists
           if (!targetDept[config.year]) targetDept[config.year] = { plans: {} };
           if (!targetDept[config.year].plans) targetDept[config.year].plans = {};
           
           // Overwrite the specific plan data
           targetDept[config.year].plans[config.type] = entry[config.type];
           matchCount++;
       }
    }
    console.log(`  -> Updated ${matchCount} departments.`);
  }

  // Final structure cleanup (optional, checks)
  const finalOutput = {
      schools: schools
  };

  console.log(`Writing merged data to ${OUTPUT_FILE}`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalOutput, null, 2), 'utf-8');
}

main();
