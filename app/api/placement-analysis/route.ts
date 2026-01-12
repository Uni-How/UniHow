import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

/**
 * 落點分析主要 API 端點
 * POST /api/placement-analysis
 * 
 * 接收用戶的成績（15級學測 + 60級分科）
 * 返回排序好的科系落點分析結果
 * 
 * 資料來源：
 * - schools collection: 包含所有學校和科系的招生資料
 * - assessment_standards: 學測五標
 * - bifurcated_standards: 分科五標  
 * - score_conversions: 15級分轉60級分表
 */

interface GSATScores {
  chinese?: number;    // 國文 15級
  english?: number;    // 英文 15級
  math_a?: number;     // 數學A 15級
  math_b?: number;     // 數學B 15級
  social?: number;     // 社會 15級
  nature?: number;     // 自然 15級
}

interface BifurcatedScores {
  math_a?: number;       // 數學甲 60級
  math_b?: number;       // 數學乙 60級
  chemistry?: number;    // 化學 60級
  physics?: number;      // 物理 60級
  biology?: number;      // 生物 60級
  history?: number;      // 歷史 60級
  geography?: number;    // 地理 60級
  civic_society?: number; // 公民 60級
}

interface PlacementAnalysisRequest {
  academic_year: number;  // 114 或 115
  admission_type: "personal_application" | "distribution_admission" | "star_plan";
  gsat_scores?: GSATScores;           // 學測成績 (15級制)
  bifurcated_scores?: BifurcatedScores;  // 分科成績 (60級制)
  english_listening?: string;  // 英聽等級 A/B/C/F
}

interface DepartmentResult {
  school_id: string;
  school_name: string;
  school_type: string;
  department_id: string;
  department_name: string;
  college: string;
  academic_group: string;
  quota: number | null;
  threshold_check: {
    all_pass: boolean;
    failed_subjects: string[];
    details: ThresholdDetail[];
  };
  score_calculation: {
    weighted_score: number;
    max_possible_score: number;
    score_percentage: number;
  };
  historical_comparison: {
    last_year_min_score: number | null;
    user_vs_min: number | null;
    probability_estimate: number;
  };
  confidence_level: "high" | "medium" | "low" | "very_low";
}

interface ThresholdDetail {
  subject: string;
  exam_type: string;
  required_threshold: string;
  required_level: number;
  user_level: number;
  pass: boolean;
  group?: number;
}

// 五標名稱對應級分
const THRESHOLD_MAP: { [key: string]: number } = {
  "頂標": 5,
  "前標": 4,
  "均標": 3,
  "後標": 2,
  "底標": 1
};

// 科目名稱對應 (中文 -> 英文 key)
const SUBJECT_MAP: { [key: string]: string } = {
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
  "公民與社會": "civic_society"
};

// 獲取五標門檻
async function getStandards(academic_year: number, test_type: "gsat" | "bifurcated") {
  const db = await dbConnect();
  
  if (test_type === "gsat") {
    const doc = await db.collection("assessment_standards").findOne({ academic_year });
    return doc?.academic_ability_test || null;
  } else {
    const doc = await db.collection("bifurcated_standards").findOne({ academic_year });
    return doc?.bifurcated_exam_standards || null;
  }
}

// 獲取級分轉換表
async function getScoreConversion(year: number) {
  const db = await dbConnect();
  const doc = await db.collection("score_conversions").findOne({ year });
  return doc?.subjects || null;
}

// 檢查單一門檻是否通過
function checkSingleThreshold(
  userScore: number,
  thresholdName: string,
  standards: any,
  subjectKey: string
): { pass: boolean; requiredLevel: number } {
  if (!standards || !standards[subjectKey]) {
    return { pass: true, requiredLevel: 0 };
  }
  
  const subjectStandards = standards[subjectKey];
  const thresholdLevel = THRESHOLD_MAP[thresholdName];
  
  if (!thresholdLevel) {
    return { pass: true, requiredLevel: 0 };
  }
  
  // 找出對應的門檻分數
  let requiredScore: number;
  switch (thresholdName) {
    case "頂標": requiredScore = subjectStandards.top; break;
    case "前標": requiredScore = subjectStandards.front; break;
    case "均標": requiredScore = subjectStandards.average; break;
    case "後標": requiredScore = subjectStandards.back; break;
    case "底標": requiredScore = subjectStandards.bottom; break;
    default: requiredScore = 0;
  }
  
  return {
    pass: userScore >= requiredScore,
    requiredLevel: requiredScore
  };
}

// 檢查科系門檻 (支援 AND/OR 邏輯)
function checkDepartmentThresholds(
  examThresholds: any[],
  userGsatScores: GSATScores,
  userBifurcatedScores: BifurcatedScores,
  gsatStandards: any,
  bifurcatedStandards: any
): { allPass: boolean; failedSubjects: string[]; details: ThresholdDetail[] } {
  if (!examThresholds || examThresholds.length === 0) {
    return { allPass: true, failedSubjects: [], details: [] };
  }
  
  const details: ThresholdDetail[] = [];
  const failedSubjects: string[] = [];
  
  // 按 group 分組
  const groupedThresholds: { [key: number]: any[] } = {};
  for (const th of examThresholds) {
    const group = th.group || 1;
    if (!groupedThresholds[group]) {
      groupedThresholds[group] = [];
    }
    groupedThresholds[group].push(th);
  }
  
  // 檢查每個 group (AND 邏輯 - 每個 group 都必須通過)
  let allGroupsPass = true;
  
  for (const [groupId, thresholds] of Object.entries(groupedThresholds)) {
    // 同一 group 內是 OR 邏輯 - 只需一個通過
    let groupPass = false;
    
    for (const th of thresholds) {
      const subjectKey = SUBJECT_MAP[th.subject] || th.subject.toLowerCase();
      const isGsat = th.exam_type === "學測";
      
      const userScore = isGsat 
        ? (userGsatScores as any)[subjectKey] || 0
        : (userBifurcatedScores as any)[subjectKey] || 0;
      
      const standards = isGsat ? gsatStandards : bifurcatedStandards;
      const { pass, requiredLevel } = checkSingleThreshold(
        userScore,
        th.threshold,
        standards,
        subjectKey
      );
      
      details.push({
        subject: th.subject,
        exam_type: th.exam_type,
        required_threshold: th.threshold,
        required_level: requiredLevel,
        user_level: userScore,
        pass,
        group: parseInt(groupId as string)
      });
      
      if (pass) {
        groupPass = true;  // OR 邏輯：有一個過就算過
      }
    }
    
    if (!groupPass) {
      allGroupsPass = false;
      // 記錄該 group 所有失敗的科目
      for (const th of thresholds) {
        failedSubjects.push(th.subject);
      }
    }
  }
  
  return {
    allPass: allGroupsPass,
    failedSubjects: [...new Set(failedSubjects)],  // 去重
    details
  };
}

// 計算加權分數
function calculateWeightedScore(
  scoringWeights: any[],
  userGsatScores: GSATScores,
  userBifurcatedScores: BifurcatedScores,
  scoreConversion: any
): { weightedScore: number; maxPossibleScore: number } {
  if (!scoringWeights || scoringWeights.length === 0) {
    return { weightedScore: 0, maxPossibleScore: 0 };
  }
  
  let weightedScore = 0;
  let maxPossibleScore = 0;
  
  for (const weight of scoringWeights) {
    const subjectKey = SUBJECT_MAP[weight.subject] || weight.subject.toLowerCase();
    const multiplier = weight.multiplier || 1;
    const isGsat = weight.source_type === "學測";
    
    let score60: number;
    
    if (isGsat) {
      const score15 = (userGsatScores as any)[subjectKey] || 0;
      // 轉換 15 級分到 60 級分
      if (scoreConversion && scoreConversion[subjectKey]) {
        const convTable = scoreConversion[subjectKey].conversion_table;
        score60 = convTable[score15.toString()]?.level_60 || score15 * 4;
      } else {
        score60 = score15 * 4;  // 預設轉換
      }
    } else {
      score60 = (userBifurcatedScores as any)[subjectKey] || 0;
    }
    
    weightedScore += score60 * multiplier;
    maxPossibleScore += 60 * multiplier;
  }
  
  return { weightedScore, maxPossibleScore };
}

// 估算錄取機率
function estimateProbability(
  userWeightedScore: number,
  lastYearMinScore: number | null,
  thresholdPassed: boolean
): number {
  if (!thresholdPassed) {
    return 0;  // 門檻未過，機率為 0
  }
  
  if (!lastYearMinScore || lastYearMinScore === 0) {
    return 0.5;  // 無歷史資料，給予中等機率
  }
  
  // 計算與去年最低分的差距
  const scoreDiff = userWeightedScore - lastYearMinScore;
  const diffPercentage = scoreDiff / lastYearMinScore;
  
  // 機率估算模型
  if (diffPercentage >= 0.1) {
    return 0.95;  // 高於去年最低 10% 以上
  } else if (diffPercentage >= 0.05) {
    return 0.85;
  } else if (diffPercentage >= 0) {
    return 0.7;   // 等於或略高於去年
  } else if (diffPercentage >= -0.05) {
    return 0.5;   // 略低於去年
  } else if (diffPercentage >= -0.1) {
    return 0.3;
  } else {
    return 0.1;   // 明顯低於去年
  }
}

// 確定信心等級
function getConfidenceLevel(probability: number): "high" | "medium" | "low" | "very_low" {
  if (probability >= 0.7) return "high";
  if (probability >= 0.5) return "medium";
  if (probability >= 0.3) return "low";
  return "very_low";
}

// 主要處理邏輯
export async function POST(request: NextRequest) {
  try {
    const body: PlacementAnalysisRequest = await request.json();
    const { 
      academic_year, 
      admission_type, 
      gsat_scores = {}, 
      bifurcated_scores = {},
      english_listening 
    } = body;

    // 驗證輸入
    if (!academic_year || !admission_type) {
      return NextResponse.json(
        { error: "Missing academic_year or admission_type" },
        { status: 400 }
      );
    }

    if (!["114", "115", 114, 115].includes(academic_year as any)) {
      return NextResponse.json(
        { error: "Invalid academic_year. Must be 114 or 115" },
        { status: 400 }
      );
    }

    const yearStr = academic_year.toString();
    const db = await dbConnect();

    // 獲取參考資料
    const [gsatStandards, bifurcatedStandards, scoreConversion] = await Promise.all([
      getStandards(academic_year, "gsat"),
      getStandards(academic_year, "bifurcated"),
      getScoreConversion(academic_year === 114 ? 113 : 114)  // 用前一年的轉換表
    ]);

    // 獲取所有學校資料
    const schools = await db.collection("schools").find({}).toArray();

    if (!schools || schools.length === 0) {
      return NextResponse.json(
        { error: "No school data found", total_results: 0, results: [] },
        { status: 200 }
      );
    }

    const results: DepartmentResult[] = [];

    // 遍歷所有學校和科系
    for (const school of schools) {
      for (const dept of school.departments || []) {
        const admissionData = dept.admission_data?.[yearStr];
        if (!admissionData) continue;

        const planData = admissionData.plans?.[admission_type];
        if (!planData) continue;

        // 檢查門檻
        const thresholdResult = checkDepartmentThresholds(
          planData.exam_thresholds || [],
          gsat_scores,
          bifurcated_scores,
          gsatStandards,
          bifurcatedStandards
        );

        // 檢查英聽門檻
        if (planData.english_listening_threshold && english_listening) {
          const listeningOrder = ["A", "B", "C", "F"];
          const requiredIdx = listeningOrder.indexOf(planData.english_listening_threshold);
          const userIdx = listeningOrder.indexOf(english_listening);
          if (userIdx > requiredIdx) {
            thresholdResult.allPass = false;
            thresholdResult.failedSubjects.push("英聽");
          }
        }

        // 計算加權分數
        const { weightedScore, maxPossibleScore } = calculateWeightedScore(
          planData.scoring_weights || [],
          gsat_scores,
          bifurcated_scores,
          scoreConversion
        );

        // 獲取去年最低分
        const lastYearMinScore = planData.last_year_pass_data?.min_score || null;

        // 估算機率
        const probability = estimateProbability(
          weightedScore,
          lastYearMinScore,
          thresholdResult.allPass
        );

        results.push({
          school_id: school.school_id,
          school_name: school.school_name,
          school_type: school.school_type,
          department_id: dept.department_id,
          department_name: dept.department_name,
          college: dept.college,
          academic_group: dept.academic_group,
          quota: planData.quota,
          threshold_check: {
            all_pass: thresholdResult.allPass,
            failed_subjects: thresholdResult.failedSubjects,
            details: thresholdResult.details
          },
          score_calculation: {
            weighted_score: Math.round(weightedScore * 100) / 100,
            max_possible_score: maxPossibleScore,
            score_percentage: maxPossibleScore > 0 
              ? Math.round((weightedScore / maxPossibleScore) * 10000) / 100 
              : 0
          },
          historical_comparison: {
            last_year_min_score: lastYearMinScore,
            user_vs_min: lastYearMinScore 
              ? Math.round((weightedScore - lastYearMinScore) * 100) / 100 
              : null,
            probability_estimate: Math.round(probability * 100) / 100
          },
          confidence_level: getConfidenceLevel(probability)
        });
      }
    }

    // 排序：先按機率降序，再按學校名稱
    results.sort((a, b) => {
      if (b.historical_comparison.probability_estimate !== a.historical_comparison.probability_estimate) {
        return b.historical_comparison.probability_estimate - a.historical_comparison.probability_estimate;
      }
      return a.school_name.localeCompare(b.school_name);
    });

    // 分類結果
    const passedThreshold = results.filter(r => r.threshold_check.all_pass);
    const failedThreshold = results.filter(r => !r.threshold_check.all_pass);

    const highConfidence = passedThreshold.filter(r => r.confidence_level === "high");
    const mediumConfidence = passedThreshold.filter(r => r.confidence_level === "medium");
    const lowConfidence = passedThreshold.filter(r => r.confidence_level === "low");
    const veryLowConfidence = passedThreshold.filter(r => r.confidence_level === "very_low");

    return NextResponse.json({
      success: true,
      academic_year,
      admission_type,
      input_scores: {
        gsat: gsat_scores,
        bifurcated: bifurcated_scores,
        english_listening
      },
      summary: {
        total_departments: results.length,
        passed_threshold: passedThreshold.length,
        failed_threshold: failedThreshold.length,
        by_confidence: {
          high: highConfidence.length,
          medium: mediumConfidence.length,
          low: lowConfidence.length,
          very_low: veryLowConfidence.length
        }
      },
      results: {
        high_confidence: highConfidence.slice(0, 50),
        medium_confidence: mediumConfidence.slice(0, 50),
        low_confidence: lowConfidence.slice(0, 30),
        very_low_confidence: veryLowConfidence.slice(0, 20),
        failed_threshold: failedThreshold.slice(0, 20)
      },
      metadata: {
        analysis_time: new Date().toISOString(),
        standards_year: academic_year
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Placement analysis error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// GET - 返回 API 說明
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/placement-analysis",
    method: "POST",
    description: "分析學生成績的落點，計算各科系錄取機率",
    supported_years: [114, 115],
    admission_types: ["personal_application", "distribution_admission", "star_plan"],
    request_body: {
      academic_year: "number (114 或 115)",
      admission_type: "string (personal_application/distribution_admission/star_plan)",
      gsat_scores: {
        description: "學測成績 (15級制)",
        fields: ["chinese", "english", "math_a", "math_b", "social", "nature"]
      },
      bifurcated_scores: {
        description: "分科成績 (60級制，distribution_admission 需要)",
        fields: ["math_a", "math_b", "physics", "chemistry", "biology", "history", "geography", "civic_society"]
      },
      english_listening: "string (A/B/C/F，選填)"
    },
    example_request: {
      academic_year: 114,
      admission_type: "distribution_admission",
      gsat_scores: {
        chinese: 13,
        english: 12,
        math_a: 14,
        social: 12,
        nature: 13
      },
      bifurcated_scores: {
        history: 45,
        geography: 42
      },
      english_listening: "A"
    },
    response_structure: {
      summary: "統計摘要",
      results: {
        high_confidence: "錄取機率 >= 70%",
        medium_confidence: "錄取機率 50-70%",
        low_confidence: "錄取機率 30-50%",
        very_low_confidence: "錄取機率 < 30%",
        failed_threshold: "未通過門檻的科系"
      }
    }
  });
}
