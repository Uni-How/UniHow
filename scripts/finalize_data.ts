import fs from 'fs';
import path from 'path';

// Define the interface for the structure (simplified based on standard.json)
// We treat the verified file as the source of truth for admission data
// and just strictly clean it.

const sourcePath = path.join(process.cwd(), '資料JSON檔', 'data_structured_FINAL_VERIFIED.json');
const outputPath = path.join(process.cwd(), '資料JSON檔', 'data_structured_COMPLETE.json');

async function main() {
  try {
    console.log(`Reading source file from: ${sourcePath}`);
    const rawData = fs.readFileSync(sourcePath, 'utf-8');
    const data = JSON.parse(rawData);

    if (!data.schools || !Array.isArray(data.schools)) {
        throw new Error('Invalid source format: "schools" array missing.');
    }

    console.log(`Processing ${data.schools.length} schools...`);

    const cleanedSchools = data.schools.map((school: any) => {
        // 1. Remove internal MongoDB _id
        const { _id, ...schoolRest } = school;

        // 2. Handle school_images
        // Standard says: [必填][Array<string>] (可為空陣列)
        // If current images are placeholders, we reset them to empty array to be "clean"
        // as per user request "if no data please fill empty".
        let validImages: string[] = [];
        if (Array.isArray(school.school_images)) {
             validImages = school.school_images.filter((img: string) => 
                img && !img.includes('via.placeholder.com')
             );
        }
        
        // 3. Clean Campuses
        const cleanedCampuses = (school.campuses || []).map((campus: any) => {
            const { _id: campusId, ...campusRest } = campus;
            return campusRest;
        });

        // 4. Clean Departments
        const cleanedDepartments = (school.departments || []).map((dept: any) => {
             const { _id: deptId, ...deptRest } = dept;
             return deptRest;
        });

        // Construct the new school object strictly ordered if possible, 
        // but JS objects are unordered. key presence is what matters.
        return {
            ...schoolRest,
            school_images: validImages,
            campuses: cleanedCampuses,
            departments: cleanedDepartments
        };
    });

    const finalData = {
        // metadata: data.metadata || {}, // REMOVED per user request
        schools: cleanedSchools
    };

    console.log(`Writing filtered data (without metadata) to: ${outputPath}`);
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf-8');
    
    // --- Generate Summary ---
    console.log('\n=== Data Summary ===');
    console.log(`Total Schools: ${cleanedSchools.length}`);
    
    let totalCampuses = 0;
    let totalDepartments = 0;
    let schoolsWithUrl = 0;
    let schoolsWithImages = 0;
    const planCounts = { '114': 0, '115': 0 };

    cleanedSchools.forEach((s: any) => {
        if (s.campuses) totalCampuses += s.campuses.length;
        if (s.school_url) schoolsWithUrl++;
        if (s.school_images && s.school_images.length > 0) schoolsWithImages++;

        if (s.departments) {
            totalDepartments += s.departments.length;
            s.departments.forEach((d: any) => {
                // Check admission data coverage
                if (d['114']) planCounts['114']++;
                if (d['115']) planCounts['115']++;
                // Also check if admission_data key exists in other forms if standard varies
                if (d.admission_data) {
                    if (d.admission_data['114']) planCounts['114']++;
                    if (d.admission_data['115']) planCounts['115']++;
                }
            });
        }
    });

    console.log(`Total Campuses: ${totalCampuses}`);
    console.log(`Total Departments: ${totalDepartments}`);
    console.log(`Schools with URL: ${schoolsWithUrl}`);
    console.log(`Schools with Images: ${schoolsWithImages} (Expected 0)`);
    console.log('Department Admission Data Coverage:');
    console.log(`  - Year 114: ${planCounts['114']} departments`);
    console.log(`  - Year 115: ${planCounts['115']} departments`);
    console.log('====================\n');
    
  } catch (error) {
    console.error('Error in finalize script:', error);
  }
}

main();
