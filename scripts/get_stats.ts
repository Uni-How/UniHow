import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), '資料JSON檔', 'data_structured_COMPLETE.json');
const raw = fs.readFileSync(filePath, 'utf-8');
const data = JSON.parse(raw);

// data should be { schools: [...] } now
const schools = data.schools || [];

let totalCampuses = 0;
let totalDepartments = 0;
let plans114 = 0;
let plans115 = 0;

schools.forEach((s: any) => {
    if (s.campuses) totalCampuses += s.campuses.length;
    if (s.departments) {
        totalDepartments += s.departments.length;
        s.departments.forEach((d: any) => {
            if (d['114']) plans114++;
            if (d['115']) plans115++;
        });
    }
});

console.log(JSON.stringify({
    totalSchools: schools.length,
    totalCampuses,
    totalDepartments,
    plans114,
    plans115
}, null, 2));
