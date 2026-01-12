
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), '資料JSON檔', 'data_structured_FINAL_VERIFIED.json');

try {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  const schools = data.schools || [];
  let placeholderImages = 0;
  let missingUrl = 0;
  let totalSchools = schools.length;

  schools.forEach(school => {
    if (school.school_images && school.school_images.some(img => img.includes('placeholder.com'))) {
      placeholderImages++;
    }
    if (!school.school_url || school.school_url === '') {
      missingUrl++;
    }
  });

  console.log(`Total Schools: ${totalSchools}`);
  console.log(`Placeholder Images: ${placeholderImages}`);
  console.log(`Missing URL: ${missingUrl}`);
  
  if (schools.length > 0) {
      // Print only specific fields to avoid huge output
      const s = schools[0];
      console.log('Sample School:', {
          name: s.school_name,
          images: s.school_images,
          url: s.school_url,
          campuses: s.campuses?.length,
          depts: s.departments?.length
      });
  }

} catch (error) {
  console.error('Error reading/parsing file:', error);
}
