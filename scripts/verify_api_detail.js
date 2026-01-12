
const fetch = require('node-fetch');

async function verifyApi() {
  try {
    const url = 'http://localhost:3004/api/schools?limit=1&detail=true';
    console.log(`Fetching ${url}...`);
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.schools || data.schools.length === 0) {
      console.error("No schools returned.");
      process.exit(1);
    }
    
    const school = data.schools[0];
    const dept = school.departments[0];
    
    console.log(`School: ${school.school_name}`);
    console.log(`Dept: ${dept.department_name}`);
    console.log(`Has Admission Data: ${!!dept.admission_data}`);
    
    if (dept.admission_data) {
       console.log("Admission Data Keys:", Object.keys(dept.admission_data));
       console.log("Verification SUCCESS: Detail mode returns data.");
    } else {
       console.error("Verification FAILED: admission_data is missing in detail mode.");
    }
    
  } catch (err) {
    console.error(err);
  }
}

verifyApi();
