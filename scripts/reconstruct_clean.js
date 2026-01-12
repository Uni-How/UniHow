const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '../資料JSON檔/data_structured_FINAL_VERIFIED.json');
const OUTPUT_PATH = path.join(__dirname, '../JSON/data_structured_final.json');

function reconstruct() {
    console.log('Reading input file:', INPUT_PATH);
    if (!fs.existsSync(INPUT_PATH)) {
        console.error('Input file not found!');
        process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
    
    let schools = [];
    if (Array.isArray(rawData)) {
        schools = rawData;
    } else if (rawData.schools && Array.isArray(rawData.schools)) {
        schools = rawData.schools;
    } else {
        console.error('Unknown file structure. Expected array or object with "schools" property.');
        process.exit(1);
    }

    console.log(`Found ${schools.length} schools. Processing...`);

    const processedSchools = schools.map(school => {
        const processedDepartments = (school.departments || []).map(dept => {
            const admission_data = {};
            const years = ['113', '114', '115'];
            
            years.forEach(year => {
                if (dept[year] && dept[year].plans) {
                    const plans = dept[year].plans;

                    // 1. Fix Star Plan Ranking Criteria
                    if (plans.star_plan) {
                        const star = plans.star_plan;
                        let criteria = [];
                        
                        // Strategy A: Convert from '分發比序項目' keys
                        const mapKeys = [
                            { key: "分發比序項目一", order: 1 },
                            { key: "分發比序項目二", order: 2 },
                            { key: "分發比序項目三", order: 3 },
                            { key: "分發比序項目四", order: 4 },
                            { key: "分發比序項目五", order: 5 },
                            { key: "分發比序項目六", order: 6 },
                            { key: "分發比序項目七", order: 7 }
                        ];

                        mapKeys.forEach(({ key, order }) => {
                            if (star[key]) {
                                criteria.push({
                                    item: star[key],
                                    order: order 
                                });
                                delete star[key];
                            }
                        });

                        // Strategy B: If no keys found, check if ranking_criteria already exists and fix it
                        if (criteria.length === 0 && Array.isArray(star.ranking_criteria)) {
                            criteria = star.ranking_criteria.map((c, index) => ({
                                item: c.item,
                                order: index + 1 // Assign order based on array position
                            }));
                        }

                        if (criteria.length > 0) {
                            star.ranking_criteria = criteria;
                        }
                    }

                    // 2. Fix Distribution Admission (scoring_weights & tie_breakers)
                    if (plans.distribution_admission) {
                        const dist = plans.distribution_admission;

                        // Fix scoring_weights: weight -> multiplier
                        if (Array.isArray(dist.scoring_weights)) {
                            dist.scoring_weights = dist.scoring_weights.map(sw => ({
                                subject: sw.subject,
                                source_type: sw.source_type || '學測/分科', // Default if missing
                                multiplier: (sw.multiplier !== undefined) ? sw.multiplier : (sw.weight !== undefined ? sw.weight : 1),
                                order: sw.order
                            }));
                        }

                        // Fix tie_breakers: Array<Object> -> Array<String>
                        if (Array.isArray(dist.tie_breakers) && dist.tie_breakers.length > 0) {
                            // Check if first element is object
                            if (typeof dist.tie_breakers[0] === 'object') {
                                // Sort by order just in case
                                dist.tie_breakers.sort((a, b) => (a.order || 0) - (b.order || 0));
                                // Extract criterion
                                dist.tie_breakers = dist.tie_breakers.map(tb => tb.criterion).filter(Boolean);
                            }
                        }
                    }

                    admission_data[year] = dept[year];
                    delete dept[year];
                }
            });

            if (dept.department_id && typeof dept.department_id !== 'string') {
                dept.department_id = String(dept.department_id);
            }

            return {
                ...dept,
                admission_data 
            };
        });

        return {
            school_id: school.school_id,
            school_name: school.school_name,
            school_type: school.school_type,
            school_images: school.school_images || [],
            school_url: school.school_url,
            campuses: school.campuses || [],
            departments: processedDepartments
        };
    });

    const outputData = {
        schools: processedSchools
    };

    console.log(`Writing filtered data to: ${OUTPUT_PATH}`);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2), 'utf-8');
    console.log('Done.');
}

reconstruct();
