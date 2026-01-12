
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({}, { strict: false });
const School = mongoose.models.School || mongoose.model('School', SchoolSchema);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unihow-admission';

async function checkData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB...');

    // Fetch one school that has departments
    const school = await School.findOne({ "departments.0": { $exists: true } }).lean();
    
    if (!school) {
        console.log("No schools found.");
        return;
    }

    const dept = school.departments[0];
    console.log(`School: ${school.school_name}, Dept: ${dept.department_name}`);
    
    if (dept.admission_data) {
        console.log("114 Data Exists:", !!dept.admission_data["114"]);
        if (dept.admission_data["114"]) {
            console.log("114 Plans:", Object.keys(dept.admission_data["114"].plans || {}));
        }
        
        console.log("115 Data Exists:", !!dept.admission_data["115"]);
        if (dept.admission_data["115"]) {
             console.log("115 Plans:", Object.keys(dept.admission_data["115"].plans || {}));
        }
    } else {
        console.log("No admission_data found.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkData();
