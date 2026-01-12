
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

async function run() {
  if (!MONGODB_URI) throw new Error('No Mongo URI');
  await mongoose.connect(MONGODB_URI);

  const result = await School.aggregate([
    { $match: { school_name: '國立臺灣大學' } },
    { $unwind: '$departments' },
    { $match: { 'departments.department_name': '中國文學系' } },
    {
       $project: {
         _id: 0,
         // SIMULATE: User Level 1 vs Threshold
         simulation_filter: {
             $filter: {
                 input: {
                     $let: {
                        vars: {
                            yearData: { $arrayElemAt: [ { $filter: { input: { $objectToArray: { $ifNull: ['$departments.admission_data', {}] } }, as: "item", cond: { $eq: ["$$item.k", "114"] } } }, 0 ] }
                        },
                        in: "$$yearData.v.plans.personal_application.exam_thresholds"
                     }
                 },
                 as: "th",
                 cond: {
                     // Check specific subject '國文' (User=1) vs Threshold. Threshold should be > 1.
                     $lt: [
                         // User Level
                         { $cond: { if: { $eq: ["$$th.subject", "國文"] }, then: 1, else: 10 } },
                         // Threshold Level
                         {
                              $switch: {
                                  branches: [
                                    { case: { $eq: ['$$th.threshold', '頂標'] }, then: 5 },
                                    { case: { $eq: ['$$th.threshold', '前標'] }, then: 4 },
                                    { case: { $eq: ['$$th.threshold', '均標'] }, then: 3 },
                                    { case: { $eq: ['$$th.threshold', '後標'] }, then: 2 },
                                    { case: { $eq: ['$$th.threshold', '底標'] }, then: 1 }
                                  ],
                                  default: 0
                              }
                         }
                     ]
                 }
             }
         },
         // Sync Fix: Empty thresholds = Pass (as per user request)
         // So if empty, we do NOT produce a failure item.
         // Effectively, just removing the empty_fail check or returning empty array.
         /*
         empty_fail: {
            // Removed to allow Pass
         }
         */
       }
    },
    {
        $project: {
            // Updated simulation count: Only count failed thresholds.
            simulation_count: { $size: { $ifNull: ["$simulation_filter", []] } },
            debug_filter_result: "$simulation_filter",
            debug_raw_data: {
                        $let: {
                            vars: {
                                yearData: { $arrayElemAt: [ { $filter: { input: { $objectToArray: { $ifNull: ['$departments.admission_data', {}] } }, as: "item", cond: { $eq: ["$$item.k", "114"] } } }, 0 ] }
                            },
                            in: "$$yearData.v.plans.personal_application.exam_thresholds"
                        }
            }
        }
    }
  ]);

  console.log('Verification Result:', JSON.stringify(result[0] || 'No Result', null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
