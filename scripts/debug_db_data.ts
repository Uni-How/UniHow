
// @ts-nocheck
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import School from '../models/School';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI2 || process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

async function run() {
  await mongoose.connect(MONGODB_URI!);

  // Check NTU specifically
  const school = await School.findOne({ school_name: '國立臺灣大學' });
  
  if (!school) {
      console.log('NTU Not Found');
      await mongoose.disconnect();
      return;
  }
  
  console.log('NTU Found:', school.school_name);
  
  school.departments.forEach((dept: any) => {
      // Access 114 data safely
      const admData = dept.admission_data; // Map or Object
      // Check if Map or Object
      let yearData;
      if (admData instanceof Map) {
          yearData = admData.get('114');
      } else if (admData && typeof admData === 'object') {
          // Verify if keys are numeric string working
          yearData = admData['114'];
      }
      
      if (!yearData) {
          console.log(`[${dept.department_name}] 114 Data Missing`);
          return;
      }
      
      const thresholds = yearData.plans?.personal_application?.exam_thresholds;
      
      if (!thresholds || !Array.isArray(thresholds) || thresholds.length === 0) {
          console.log(`[${dept.department_name}] Thresholds Missing/Empty`);
      } else {
          // Valid thresholds found
          // console.log(`[${dept.department_name}] Thresholds OK: ${thresholds.length}`);
      }
  });

  await mongoose.disconnect();
}

run().catch(console.error);
