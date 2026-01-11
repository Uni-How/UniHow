import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import dbConnect from "@/lib/mongodb";
import School from "@/models/School";

// ⚠️ FORCE DYNAMIC: 確保 API 不會被快取，每次都執行真實運算
export const dynamic = "force-dynamic";
export const revalidate = 0;

// --- Helpers & Constants (輔助函式與常數) ---

/*
 * 地區對映表 (Region Mapping)
 * 用途：將台灣的縣市歸類為七大地理區域，方便使用者進行大範圍篩選。
 * 使用時機：在 getRegion 函式中被呼叫。
 */
const REGION_MAPPING: { [key: string]: string[] } = {
  北北基: ["臺北市", "新北市", "基隆市"],
  桃竹苗: ["桃園市", "新竹縣", "新竹市", "苗栗縣"],
  中彰投: ["臺中市", "彰化縣", "南投縣"],
  雲嘉南: ["雲林縣", "嘉義縣", "嘉義市", "臺南市"],
  高屏: ["高雄市", "屏東縣"],
  宜花東: ["宜蘭縣", "花蓮縣", "臺東縣"],
  離島: ["澎湖縣", "金門縣", "連江縣"],
};

function getRegion(city: string): string {
  for (const [region, cities] of Object.entries(REGION_MAPPING)) {
    if (cities.includes(city)) {
      return region;
    }
  }
  return "其他";
}

/*
 * 英聽等級權重 (Listening Map)
 * 用途：將英聽等級 (A, B, C, F) 轉換為數值，以便在資料庫查詢時進行「大於等於」的比對。
 * 數值越高代表等級越高 (A=4)。
 * 注意："--" 與 "無" 視為 0，代表該校系不設限。
 */
const LISTENING_MAP: { [key: string]: number } = {
  A: 4,
  B: 3,
  C: 2,
  F: 1,
  "--": 0,
  無: 0, // 明確定義不採計為 0
};

// 114學年度五標對照表 (用於將使用者分數轉為級別)
// 陣列結構：[頂標, 前標, 均標, 後標, 底標]
// 例如：國文 13分以上為頂標(Level 5)，12分以上為前標(Level 4)...
const SUBJECT_THRESHOLDS: { [key: string]: number[] } = {
  國文: [13, 12, 10, 9, 7],
  英文: [13, 11, 8, 4, 3],
  數學A: [11, 9, 6, 4, 3],
  數學B: [12, 10, 6, 4, 3],
  社會: [13, 12, 10, 8, 7],
  自然: [13, 12, 9, 7, 5],
};

// 五標對照 (名稱 -> Level)
const THRESHOLD_TO_LEVEL: { [key: string]: number } = {
  "頂標": 5,
  "前標": 4,
  "均標": 3,
  "後標": 2,
  "底標": 1,
};

/*
 * 計算級別 (getProjectedLevel)
 * 輸入：單科分數 (score)、科目名稱 (subject)
 * 輸出：對應的級別 (0~5)，5=頂標, 1=底標, 0=未達標
 */
function getProjectedLevel(score: number, subject: string): number {
  const thresholds = SUBJECT_THRESHOLDS[subject] || [13, 10, 7, 4, 1];
  if (score >= thresholds[0]) return 5; // 頂標
  if (score >= thresholds[1]) return 4; // 前標
  if (score >= thresholds[2]) return 3; // 均標
  if (score >= thresholds[3]) return 2; // 後標
  if (score >= thresholds[4]) return 1; // 底標
  return 0; // 未達底標
}

const SUBJECT_MAP: { [key: string]: string } = {
  chinese: "國文",
  english: "英文",
  mathA: "數學A",
  mathB: "數學B",
  science: "自然",
  social: "社會",
};

// 分科科目對照 (URL key -> 中文名)
const BIFURCATED_SUBJECT_MAP: { [key: string]: string } = {
  bifurcatedMathIA: "數學甲",
  bifurcatedMathIB: "數學乙",
  bifurcatedPhysics: "物理",
  bifurcatedChemistry: "化學",
  bifurcatedBiology: "生物",
  bifurcatedHistory: "歷史",
  bifurcatedGeography: "地理",
  bifurcatedCivics: "公民與社會",
};

// 中文科目 -> API 欄位 key (用於 scoring_weights 比對)
const SUBJECT_TO_KEY: { [key: string]: string } = {
  "國文": "chinese",
  "英文": "english",
  "數學A": "math_a",
  "數學B": "math_b",
  "社會": "social",
  "自然": "nature",
  "數學甲": "math_a",
  "數學乙": "math_b",
  "物理": "physics",
  "化學": "chemistry",
  "生物": "biology",
  "歷史": "history",
  "地理": "geography",
  "公民與社會": "civic_society",
};

// 快取 Metadata
const getSchoolMetadata = unstable_cache(
  async () => {
    await dbConnect();
    const academic_groups = await School.distinct("departments.academic_group");
    const colleges = await School.distinct("departments.college");
    const cities = await School.distinct("campuses.location.city");
    const regions = Array.from(
      new Set(cities.map((city: string) => getRegion(city)))
    ).sort();
    return {
      academic_groups: academic_groups.sort(),
      colleges: colleges.sort(),
      regions,
      cities: cities.sort(),
    };
  },
  ["school-metadata"],
  { revalidate: 300, tags: ["metadata"] }
);

// === 落點分析輔助函式 ===

interface ThresholdCheckResult {
  allPass: boolean;
  failedSubjects: string[];  // 未通過的科目名稱
  details: {
    subject: string;
    threshold: string;
    userLevel: number;
    requiredLevel: number;
    pass: boolean;
    group?: number;
  }[];
}

// 檢查科系門檻 (支援 AND/OR 邏輯)
function checkExamThresholds(
  examThresholds: any[],
  userLevels: { [key: string]: number }
): ThresholdCheckResult {
  if (!examThresholds || examThresholds.length === 0) {
    return { allPass: true, failedSubjects: [], details: [] };
  }

  const details: ThresholdCheckResult["details"] = [];
  
  // 按 group 分組
  const groupedThresholds: { [groupId: number]: any[] } = {};
  examThresholds.forEach(th => {
    const groupId = th.group ?? 0;
    if (!groupedThresholds[groupId]) groupedThresholds[groupId] = [];
    groupedThresholds[groupId].push(th);
  });

  const failedGroups: number[] = [];
  const failedSubjects: string[] = [];

  // 遍歷每個 group (AND 關係)
  for (const [groupIdStr, thresholds] of Object.entries(groupedThresholds)) {
    const groupId = parseInt(groupIdStr);
    let groupPassed = false; // 同一 group 內是 OR 關係，只要有一個通過即可

    for (const th of thresholds) {
      const subject = th.subject;
      const threshold = th.threshold;
      const requiredLevel = THRESHOLD_TO_LEVEL[threshold] || 0;
      const userLevel = userLevels[subject] ?? 0;
      const pass = userLevel >= requiredLevel;

      details.push({
        subject,
        threshold,
        userLevel,
        requiredLevel,
        pass,
        group: groupId,
      });

      if (pass) {
        groupPassed = true;
      }
    }

    // 如果整個 group 都沒通過
    if (!groupPassed) {
      failedGroups.push(groupId);
      // 記錄該 group 的所有科目為失敗
      thresholds.forEach(th => {
        if (!failedSubjects.includes(`${th.subject}(${th.threshold})`)) {
          failedSubjects.push(`${th.subject}(${th.threshold})`);
        }
      });
    }
  }

  return {
    allPass: failedGroups.length === 0,
    failedSubjects,
    details,
  };
}

// 計算加權分數
function calculateWeightedScore(
  scoringWeights: any[],
  userGsatScores: { [key: string]: number },
  userBifurcatedScores: { [key: string]: number }
): { weightedScore: number; maxPossibleScore: number } {
  if (!scoringWeights || scoringWeights.length === 0) {
    return { weightedScore: 0, maxPossibleScore: 0 };
  }

  let weightedScore = 0;
  let maxPossibleScore = 0;

  for (const weight of scoringWeights) {
    const subject = weight.subject;
    const sourceType = weight.source_type; // "gsat" 或 "bifurcated"
    const multiplier = weight.multiplier || 1;
    const subjectKey = SUBJECT_TO_KEY[subject];

    if (!subjectKey) continue;

    let userScore = 0;
    let maxScore = 0;

    if (sourceType === "gsat" || sourceType === "學測") {
      // 學測是 15 級分，轉換為 60 級 (乘4)
      userScore = (userGsatScores[subjectKey] || 0) * 4;
      maxScore = 60;
    } else if (sourceType === "bifurcated" || sourceType === "分科") {
      userScore = userBifurcatedScores[subjectKey] || 0;
      maxScore = 60;
    }

    weightedScore += userScore * multiplier;
    maxPossibleScore += maxScore * multiplier;
  }

  return { weightedScore, maxPossibleScore };
}

// 估計錄取機率
function estimateProbability(
  weightedScore: number,
  lastYearMinScore: number | null
): { probability: number; confidenceLevel: "high" | "medium" | "low" | "very_low" } {
  if (lastYearMinScore === null || lastYearMinScore === 0) {
    return { probability: 0.5, confidenceLevel: "medium" };
  }

  const diff = weightedScore - lastYearMinScore;
  const ratio = weightedScore / lastYearMinScore;

  let probability: number;
  if (ratio >= 1.15) probability = 0.95;
  else if (ratio >= 1.10) probability = 0.85;
  else if (ratio >= 1.05) probability = 0.75;
  else if (ratio >= 1.0) probability = 0.65;
  else if (ratio >= 0.95) probability = 0.45;
  else if (ratio >= 0.90) probability = 0.30;
  else probability = 0.15;

  let confidenceLevel: "high" | "medium" | "low" | "very_low";
  if (probability >= 0.7) confidenceLevel = "high";
  else if (probability >= 0.5) confidenceLevel = "medium";
  else if (probability >= 0.3) confidenceLevel = "low";
  else confidenceLevel = "very_low";

  return { probability, confidenceLevel };
}

// --- MAIN API ROUTE (主 API 處理函式) ---

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    // 1. Basic Params (基本篩選參數)
    const region = searchParams.get("region");
    const school_id = searchParams.get("school_id");
    const type = searchParams.get("type"); // 公立/私立
    // 分頁參數
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;
    // detail=true 時會回傳完整的 admission_data，否則只回傳基本資料以節省流量
    const detail = searchParams.get("detail") === "true";

    // 2. Advanced Params (進階篩選)
    const year = searchParams.get("year") || "114"; // 預設 114學年度
    const method = searchParams.get("method") || "personal_application"; // 入學管道 預設個人申請
    const group = searchParams.get("group"); // 學群
    const listening = searchParams.get("listening"); // 英聽要求

    const scoreKeys = [
      "chinese",
      "english",
      "mathA",
      "mathB",
      "science",
      "social",
    ];
    const hasScores = scoreKeys.some((s) => searchParams.has(s)); // 檢查是否有輸入任何成績
    // 當有進階參數時，啟用 Aggregation Mode，否則使用 Simple Query
    const hasAdvancedFilters = method || group || listening || hasScores;

    // 3. User Scores Parsing (解析使用者成績)
    // 將 URL 中的分數參數轉換為 Level (0-5)
    // userLevels 例如: { "國文": 4, "數學A": 3 }
    const userLevels: { [key: string]: number } = {};
    const userGsatScores: { [key: string]: number } = {}; // 原始學測分數 (15級)
    const userBifurcatedScores: { [key: string]: number } = {}; // 分科分數 (60級)
    
    if (hasScores) {
      scoreKeys.forEach((subj) => {
        if (searchParams.has(subj)) {
          const val = parseInt(searchParams.get(subj) || "0");
          if (!isNaN(val) && val > 0) {
            const subjectName = SUBJECT_MAP[subj];
            userLevels[subjectName] = getProjectedLevel(val, subjectName);
            // 儲存原始分數用於加權計算
            const key = SUBJECT_TO_KEY[subjectName];
            if (key) userGsatScores[key] = val;
          }
        }
      });
    }

    // 解析分科成績
    const bifurcatedKeys = Object.keys(BIFURCATED_SUBJECT_MAP);
    const hasBifurcatedScores = bifurcatedKeys.some((k) => searchParams.has(k));
    
    if (hasBifurcatedScores) {
      bifurcatedKeys.forEach((subj) => {
        if (searchParams.has(subj)) {
          const val = parseInt(searchParams.get(subj) || "0");
          if (!isNaN(val) && val > 0) {
            const subjectName = BIFURCATED_SUBJECT_MAP[subj];
            const key = SUBJECT_TO_KEY[subjectName];
            if (key) userBifurcatedScores[key] = val;
          }
        }
      });
    }

    // 是否需要執行落點分析 (有成績輸入時)
    const shouldCalculatePlacement = hasScores || hasBifurcatedScores;
    // 是否包含未通過門檻的科系
    const includeFailedThreshold = searchParams.get("includeFailedThreshold") === "true";

    // 4. Projection (資料投影)
    // 定義 API 回傳的欄位，排除不必要的深層資料以提升效能
    const projection = {
      school_id: 1,
      school_name: 1,
      school_type: 1,
      school_url: 1,
      school_images: 1,
      campuses: 1,
      // 僅回傳部門摘要
      "departments.department_id": 1,
      "departments.department_name": 1,
      "departments.college": 1,
      "departments.academic_group": 1,
      "departments.campus_ids": 1,
      "departments._id": 1,
      // 當 detail=true 時才加入詳細的 admission_data
      ...(detail ? { "departments.admission_data": 1 } : {}),
    };

    let schools;
    let total;

    if (!hasAdvancedFilters) {
      // --- Simple Query Mode (簡單查詢模式) ---
      // 僅依據學校本身屬性 (地區、公私立) 搜尋，不涉及複雜的門檻比對
      const query: any = {};
      if (school_id) query.school_id = school_id;
      if (type) query.school_type = type;
      if (region) {
        // 使用 $elemMatch 查詢 nested array (campuses.location.city)
        query.campuses = {
          $elemMatch: { is_main: true, "location.city": region },
        };
      }
      total = await School.countDocuments(query);
      schools = await School.find(query)
        .select(projection)
        .skip(skip)
        .limit(limit);
    } else {
      // --- Aggregation Pipeline Mode (聚合管道模式 - Optimized) ---
      // 使用 MongoDB Aggregation Framework 處理複雜邏輯 (篩選、重構、部分匹配)

      const planKey = method || "star_plan";
      const userListeningLevel = LISTENING_MAP[listening || "F"] || 1; // 預設放寬

      const pipeline: any[] = [];

      // [Stage 1] Filter School Level (初步篩選學校)
      // 先把完全不符合基本條件 (如地區) 的學校濾掉，減少後續運算量
      const matchStage: any = {};
      if (school_id) matchStage.school_id = school_id;
      if (type) matchStage.school_type = type;
      if (region) {
        matchStage.campuses = {
          $elemMatch: { is_main: true, "location.city": region },
        };
      }
      pipeline.push({ $match: matchStage });

      // [Stage 2] Early Projection (提早投影 - 優化關鍵)
      // 在 Unwind 之前就先丟棄不必要的資料 (如非目標年份的 admission_data)，減少記憶體消耗
      pipeline.push({
        $project: {
          school_id: 1,
          school_name: 1,
          school_type: 1,
          school_url: 1,
          school_images: 1,
          campuses: 1,
          departments: 1,
        },
      });

      // [Stage 3] Pre-Filter Departments (預先篩選科系 - 優化關鍵)
      // 如果使用者有指定學群，在 Unwind 之前就先把不符合的科系濾掉
      if (group) {
        pipeline.push({
          $addFields: {
            departments: {
              $filter: {
                input: "$departments",
                as: "dept",
                cond: { $eq: ["$$dept.academic_group", group] },
              },
            },
          },
        });
      }

      // [Stage 4] Unwind Departments (拆分科系)
      pipeline.push({ $unwind: "$departments" });

      // [Stage 5] Flatten Data (資料扁平化)
      // 將深層的 admission_data 提取到頂層暫存欄位

      // 5.1 提取目標年度資料
      pipeline.push({
        $addFields: {
          __year_entry: {
            $arrayElemAt: [
              {
                $filter: {
                  input: {
                    $objectToArray: {
                      $ifNull: ["$departments.admission_data", {}],
                    },
                  },
                  as: "item",
                  cond: { $eq: ["$$item.k", year] },
                },
              },
              0,
            ],
          },
        },
      });

      // 5.2 提取目標計畫 (Plan)
      pipeline.push({
        $addFields: {
          __target_plan: {
            $switch: {
              branches: [
                {
                  case: { $eq: [planKey, "star_plan"] },
                  then: "$__year_entry.v.plans.star_plan",
                },
                {
                  case: { $eq: [planKey, "personal_application"] },
                  then: "$__year_entry.v.plans.personal_application",
                },
                {
                  case: { $eq: [planKey, "distribution_admission"] },
                  then: "$__year_entry.v.plans.distribution_admission",
                },
              ],
              default: null,
            },
          },
        },
      });

      // 5.3 提取 115 年度分發入學計畫以檢查去年結果 (114 最低錄取分數/人數)
      // 無論使用者查詢年度，這裡都額外取得 115 年度的 distribution 資料來判斷 last_year_pass_data 是否存在
      pipeline.push({
        $addFields: {
          __last_year_entry: {
            $arrayElemAt: [
              {
                $filter: {
                  input: {
                    $objectToArray: {
                      $ifNull: ["$departments.admission_data", {}],
                    },
                  },
                  as: "item",
                  cond: { $eq: ["$$item.k", "115"] },
                },
              },
              0,
            ],
          },
        },
      });
      pipeline.push({
        $addFields: {
          __last_year_plan: "$__last_year_entry.v.plans.distribution_admission",
        },
      });

      // [Stage 6] Filter Logic ($match) - 核心篩選階段
      const advancedMatch: any = {
        __target_plan: { $ne: null }, // 必須有該年度計畫 (防呆)
        __year_entry: { $ne: null }, // 確保該年度資料存在
      };

      // 學群篩選 (如果在 Stage 3 沒做，這裡會再次確認，或者作為雙重保險)
      if (group) {
        advancedMatch["departments.academic_group"] = group;
      }

      // Listening Filter (英聽篩選)
      if (listening) {
        advancedMatch["$expr"] = {
          $lte: [
            {
              $switch: {
                branches: [
                  {
                    case: {
                      $eq: [
                        {
                          $ifNull: [
                            "$__target_plan.english_listening_threshold",
                            "F",
                          ],
                        },
                        "A",
                      ],
                    },
                    then: 4,
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $ifNull: [
                            "$__target_plan.english_listening_threshold",
                            "F",
                          ],
                        },
                        "B",
                      ],
                    },
                    then: 3,
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $ifNull: [
                            "$__target_plan.english_listening_threshold",
                            "F",
                          ],
                        },
                        "C",
                      ],
                    },
                    then: 2,
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $ifNull: [
                            "$__target_plan.english_listening_threshold",
                            "F",
                          ],
                        },
                        "F",
                      ],
                    },
                    then: 1,
                  },
                  {
                    case: {
                      $in: [
                        {
                          $ifNull: [
                            "$__target_plan.english_listening_threshold",
                            "F",
                          ],
                        },
                        ["--", "無"],
                      ],
                    },
                    then: 0,
                  },
                ],
                default: 0,
              },
            },
            userListeningLevel,
          ],
        };
      }

      // 在查詢 114 年度的分發入學時，只返回具備去年錄取結果的科系
      // 說明：資料庫將 114 年度的錄取結果嵌入在 115 年度的 distribution_admission 的 last_year_pass_data
      // 因此當 year=114 且 method=distribution_admission 時，要求 __last_year_plan.last_year_pass_data 不為 null
      if (planKey === "distribution_admission" && year === "114") {
        advancedMatch["__last_year_plan.last_year_pass_data"] = { $ne: null };
      }

      // Subject Score Filter (學測成績篩選 - 支持AND/OR邏輯)
      // 新邏輯：根據 group 字段判斷 AND/OR 關係
      // - 同一 group 內的多個科目 = OR關係 (只需滿足其一)
      // - 不同 group = AND關係 (所有group都要滿足至少一個科目)
      if (hasScores) {
        const thresholdCheckExpr = {
          $eq: [
            0, // 目標：失敗的 group 數 = 0 (所有group都至少滿足一個科目)
            {
              $size: {
                $filter: {
                  input: {
                    // 先取得所有unique的group IDs
                    $reduce: {
                      input: { $ifNull: ["$__target_plan.exam_thresholds", []] },
                      initialValue: [],
                      in: {
                        $cond: [
                          { $in: ["$$this.group", "$$value"] },
                          "$$value",
                          { $concatArrays: ["$$value", ["$$this.group"]] }
                        ]
                      }
                    }
                  },
                  as: "groupId",
                  cond: {
                    // 檢查該group是否 ALL items fail (都不滿足 = true)
                    $eq: [
                      {
                        $size: {
                          $filter: {
                            input: { $ifNull: ["$__target_plan.exam_thresholds", []] },
                            as: "th",
                            cond: {
                              $and: [
                                { $eq: ["$$th.group", "$$groupId"] },
                                // 使用者滿足此科目的門檻
                                {
                                  $gte: [
                                    {
                                      $switch: {
                                        branches: [
                                          { case: { $eq: ["$$th.subject", "國文"] }, then: userLevels["國文"] ?? 0 },
                                          { case: { $eq: ["$$th.subject", "英文"] }, then: userLevels["英文"] ?? 0 },
                                          { case: { $eq: ["$$th.subject", "數學A"] }, then: userLevels["數學A"] ?? 0 },
                                          { case: { $eq: ["$$th.subject", "數學B"] }, then: userLevels["數學B"] ?? 0 },
                                          { case: { $eq: ["$$th.subject", "自然"] }, then: userLevels["自然"] ?? 0 },
                                          { case: { $eq: ["$$th.subject", "社會"] }, then: userLevels["社會"] ?? 0 },
                                        ],
                                        default: 0,
                                      }
                                    },
                                    {
                                      $switch: {
                                        branches: [
                                          { case: { $eq: ["$$th.threshold", "頂標"] }, then: 5 },
                                          { case: { $eq: ["$$th.threshold", "前標"] }, then: 4 },
                                          { case: { $eq: ["$$th.threshold", "均標"] }, then: 3 },
                                          { case: { $eq: ["$$th.threshold", "後標"] }, then: 2 },
                                          { case: { $eq: ["$$th.threshold", "底標"] }, then: 1 },
                                        ],
                                        default: 0,
                                      }
                                    }
                                  ]
                                }
                              ]
                            }
                          }
                        }
                      },
                      0 // 該group沒有任何科目被滿足 = 該group失敗
                    ]
                  }
                }
              },
            },
          ],
        };

        advancedMatch["__target_plan.exam_thresholds"] = {
          $exists: true,
          $ne: [],
        };

        if (advancedMatch["$expr"]) {
          advancedMatch["$expr"] = {
            $and: [advancedMatch["$expr"], thresholdCheckExpr],
          };
        } else {
          advancedMatch["$expr"] = thresholdCheckExpr;
        }
      }

      pipeline.push({ $match: advancedMatch });

      // [Stage 7] Regroup back to School (重新分組 - Optimized)
      // 明確指定欄位，避免巢狀過深
      pipeline.push({
        $group: {
          _id: "$_id",
          school_id: { $first: "$school_id" },
          school_name: { $first: "$school_name" },
          school_type: { $first: "$school_type" },
          school_url: { $first: "$school_url" },
          school_images: { $first: "$school_images" },
          campuses: { $first: "$campuses" },
          departments: { $push: "$departments" },
        },
      });

      // [Stage 8] Final Projection (清理暫存欄位)
      // 使用與前面定義一致的 projection 物件
      pipeline.push({ $project: projection });

      // Count & Pagination (計數與分頁)
      const facetStage = {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { school_id: 1 } },
            { $skip: skip },
            { $limit: limit },
          ],
        },
      };
      pipeline.push(facetStage);

      const result = await School.aggregate(pipeline);

      total = result[0].metadata[0]?.total || 0;
      schools = result[0].data;
    }

    // === 落點分析計算 ===
    // 如果使用者有輸入成績，為每個科系計算落點分析資料
    if (shouldCalculatePlacement && schools && schools.length > 0) {
      const planKey = method || "distribution_admission";
      
      schools = schools.map((school: any) => {
        const enhancedDepartments = school.departments.map((dept: any) => {
          const yearData = dept.admission_data?.[year];
          const plan = yearData?.plans?.[planKey];
          
          if (!plan) {
            return {
              ...dept,
              placement_analysis: null
            };
          }

          // 檢查門檻
          const thresholdResult = checkExamThresholds(
            plan.exam_thresholds || [],
            userLevels
          );

          // 計算加權分數
          const { weightedScore, maxPossibleScore } = calculateWeightedScore(
            plan.scoring_weights || [],
            userGsatScores,
            userBifurcatedScores
          );

          // 獲取去年最低錄取分數
          // 如果是 114 年度，去 115 年度的 last_year_pass_data 找
          // 如果是 115 年度，去 plan 本身的 last_year_pass_data 找
          let lastYearMinScore: number | null = null;
          if (year === "114") {
            const year115Data = dept.admission_data?.["115"];
            lastYearMinScore = year115Data?.plans?.[planKey]?.last_year_pass_data?.min_score || null;
          } else {
            lastYearMinScore = plan.last_year_pass_data?.min_score || null;
          }

          // 估計機率
          const { probability, confidenceLevel } = estimateProbability(
            weightedScore,
            lastYearMinScore
          );

          return {
            ...dept,
            placement_analysis: {
              threshold_check: {
                all_pass: thresholdResult.allPass,
                failed_subjects: thresholdResult.failedSubjects,
                details: thresholdResult.details,
              },
              score_calculation: {
                weighted_score: weightedScore,
                max_possible_score: maxPossibleScore,
                score_percentage: maxPossibleScore > 0 ? (weightedScore / maxPossibleScore) * 100 : 0,
              },
              historical_comparison: {
                last_year_min_score: lastYearMinScore,
                user_vs_min: lastYearMinScore ? weightedScore - lastYearMinScore : null,
                probability_estimate: probability,
              },
              confidence_level: confidenceLevel,
            }
          };
        });

        // 根據 includeFailedThreshold 參數決定是否過濾未通過門檻的科系
        let filteredDepts = enhancedDepartments;
        if (!includeFailedThreshold) {
          // 保留：1) 沒有 placement_analysis 的科系 2) 通過門檻的科系
          filteredDepts = enhancedDepartments.filter((d: any) => 
            !d.placement_analysis || d.placement_analysis.threshold_check.all_pass
          );
        }

        // 統計未通過門檻的科系數量
        const failedCount = enhancedDepartments.filter((d: any) => 
          d.placement_analysis && !d.placement_analysis.threshold_check.all_pass
        ).length;

        return {
          ...school,
          departments: filteredDepts,
          placement_summary: {
            total_departments: enhancedDepartments.length,
            passed_threshold: enhancedDepartments.length - failedCount,
            failed_threshold: failedCount,
          }
        };
      });

      // 過濾掉沒有任何科系的學校 (可能因為全部未通過門檻)
      if (!includeFailedThreshold) {
        schools = schools.filter((s: any) => s.departments.length > 0);
      }
    }

    const metadata = await getSchoolMetadata();

    return NextResponse.json({
      metadata,
      schools,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
      // 如果有落點分析，返回額外資訊
      ...(shouldCalculatePlacement ? {
        placement_enabled: true,
        user_scores: {
          gsat: userGsatScores,
          bifurcated: userBifurcatedScores,
          levels: userLevels,
        }
      } : {}),
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
