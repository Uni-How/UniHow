
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI2;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable');
  process.exit(1);
}

const schoolSchema = new mongoose.Schema({
  school_name: String,
  departments: [{
    department_name: String,
    admission_data: mongoose.Schema.Types.Mixed
  }]
});

const School = mongoose.models.School || mongoose.model('School', schoolSchema);

async function checkData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const schoolName = "國立臺灣師範大學";
    const deptName = "物理學系";

    const school = await School.findOne({ school_name: schoolName });

    if (!school) {
      console.log('School not found');
      return;
    }

    const dept = school.departments.find(d => d.department_name === deptName);
    if (!dept) {
      console.log('Department not found');
      return;
    }

    console.log(`\nFound Department: ${schoolName} - ${deptName}`);
    
    const admission114 = dept.admission_data['114'];
    if (!admission114) {
      console.log('No data for 114');
      return;
    }

    const plan = admission114.plans.personal_application;
    if (!plan) {
      console.log('No personal_application plan');
      return;
    }

    console.log('Raw Thresholds Data:');
    console.log(JSON.stringify(plan.exam_thresholds, null, 2));

    if (plan.exam_thresholds) {
        plan.exam_thresholds.forEach(th => {
            console.log(`Subject: '${th.subject}', Threshold: '${th.threshold}', Length: ${th.threshold.length}`);
            for(let i=0; i<th.threshold.length; i++) {
                console.log(`  Char ${i}: ${th.threshold.charCodeAt(i)}`);
            }
        });
    }

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

checkData();
