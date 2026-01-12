import fs from 'fs';
import path from 'path';

const FILE_PATH = path.join(process.cwd(), '資料JSON檔', 'data_structured_final_1211.json');

// Mapping from "Ministry Discipline" (Current Value) to "18 Academic Groups" (Target)
const CATEGORY_MAP: Record<string, string> = {
  "語文": "文史哲學群", // Default to Lit/Hist/Phil, separate from Foreign Lang
  "人文": "文史哲學群",
  "新聞學及圖書資訊": "大眾傳播學群",
  "藝術": "藝術學群",
  "數學及統計": "數理化學群",
  "物理、化學及地球科學": "數理化學群", // See override below
  "社會及行為科學": "社會與心理學群",
  "未分類": "其他",
  "社會福利": "社會與心理學群",
  "醫藥衛生": "醫藥衛生學群",
  "建築及營建工程": "建築與設計學群",
  "工程及工程業": "工程學群",
  "農業": "生物資源學群",
  "林業": "生物資源學群",
  "獸醫": "生物資源學群",
  "生命科學": "生命科學學群",
  "商業及管理": "管理學群",
  "資訊通訊科技": "資訊學群",
  "法律": "法政學群",
  "餐旅及民生服務": "遊憩與運動學群", // Often Tourism/Hospitality -> Recreation
  "教育": "教育學群",
  "環境": "地球與環境學群",
  "製造及加工": "工程學群",
  "運輸服務": "管理學群", // Transport usually Logistics/Mgmt
  "其他": "其他",
  "外語": "外語學群",
  "財經": "財經學群",
  "漁業": "生物資源學群",
  "衛生及職業衛生服務": "醫藥衛生學群",
  "管理": "管理學群",
  "安全服務": "法政學群"
};

// Keyword overrides based on Department Name for finer granularity
const KEYWORD_OVERRIDES: Array<{ keyword: string, group: string }> = [
    { keyword: "地球", group: "地球與環境學群" },
    { keyword: "地質", group: "地球與環境學群" },
    { keyword: "大氣", group: "地球與環境學群" },
    { keyword: "地理", group: "地球與環境學群" }, // Geography often Earth or Social, strictly Earth in 18 groups? Usually Earth & Env.
    { keyword: "體育", group: "遊憩與運動學群" },
    { keyword: "運動", group: "遊憩與運動學群" },
    { keyword: "休閒", group: "遊憩與運動學群" },
    { keyword: "觀光", group: "遊憩與運動學群" }, // Tourism -> Recreation
    { keyword: "餐旅", group: "遊憩與運動學群" },
    { keyword: "心理", group: "社會與心理學群" }, // Ensure Psychology hits correct group
    { keyword: "輔導", group: "社會與心理學群" },
    { keyword: "社工", group: "社會與心理學群" },
    { keyword: "社會工作", group: "社會與心理學群" },
    { keyword: "資訊", group: "資訊學群" }, // Computer Science
    { keyword: "電子", group: "工程學群" }, // Electronics often Eng, sometimes Info? 18 Groups: Info includes EE/CS. Eng includes Mech/Civil. 
    // Wait, 18 groups: "資訊學群" includes "電機工程"(Electrical), "電子工程"(Electronic)? 
    // Collego: "工程學群" includes EE/Electronic? Let's check search result.
    // Search result [6]: "資訊學群" includes CS, Info Mgmt, Digital learning. 
    // Search result [1] -> [6]: "資訊學群" includes "電機工程學類"? 
    // Wait, Search result [1] says Info Group includes "電機工程學類"! 
    // Search result [2] says "工程學群" includes EE. 
    // Actually, traditionally EE/CS is "資訊" or "工程"?
    // In Collego "資訊學群" is mainly CS/Soft/Info. "工程學群" is Electrical/Mech/Civil.
    // However, some sources put EE in Info.
    // Let's stick to a safe default: "資訊" in name -> Info. "工程" -> Engineering.
];

async function main() {
    try {
        console.log(`Reading from: ${FILE_PATH}`);
        const raw = fs.readFileSync(FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        
        let updateCount = 0;
        let unknownCategories = new Set<string>();

        data.schools.forEach((school: any) => {
            if (school.departments) {
                school.departments.forEach((dept: any) => {
                    const currentCat = dept.academic_group;
                    let targetGroup = CATEGORY_MAP[currentCat];

                    // Identify unknown categories
                    if (!targetGroup) {
                        unknownCategories.add(currentCat);
                        targetGroup = "未分類"; // Fallback
                    }

                    // Apply Keyword Overrides
                    for (const rule of KEYWORD_OVERRIDES) {
                        if (dept.department_name.includes(rule.keyword)) {
                            targetGroup = rule.group;
                            break; // First match wins precedence
                        }
                    }
                    
                    // Specific fix for EE/CS overlap if needed? 
                    // Current logic: Category map first, then keywords.
                    
                    if (targetGroup && targetGroup !== currentCat) {
                        // dept.academic_category = currentCat; // Optional: Backup old value? User said "convert".
                        dept.academic_group = targetGroup;
                        updateCount++;
                    }
                });
            }
        });

        console.log(`Updated ${updateCount} departments.`);
        if (unknownCategories.size > 0) {
            console.warn('Unknown Categories found:', [...unknownCategories]);
        }

        console.log(`Writing to: ${FILE_PATH}`); // Overwriting as implied by "use the file"
        fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');

        // Regenerate stats?
        const groups = new Set();
        data.schools.forEach((s: any) => s.departments?.forEach((d: any) => groups.add(d.academic_group)));
        console.log('New Academic Groups:', [...groups]);

    } catch (e) {
        console.error(e);
    }
}

main();
