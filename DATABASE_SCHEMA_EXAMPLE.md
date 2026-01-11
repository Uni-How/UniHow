# MongoDB 資料庫結構範例

## 資料庫名稱
```
unihow_admission_db
```

---

## Collection 1: assessment_standards（學測五標）

### 結構範例

```javascript
// 113年學測五標
{
  "_id": ObjectId("..."),
  "academic_year": 113,
  "description": "113學年度學科能力測驗級分標準（全國統一）",
  "source": "大考中心公告",
  "last_updated": ISODate("2024-02-01"),
  "academic_ability_test": {
    "chinese": {
      "subject_name": "國文",
      "max_score": 15,
      "top": 13,          // 頂標：前12%
      "front": 12,        // 前標：前25%
      "average": 11,      // 均標：前50%
      "back": 9,          // 後標：前75%
      "bottom": 8         // 底標：前88%
    },
    "english": {
      "subject_name": "英文",
      "max_score": 15,
      "top": 13,
      "front": 11,
      "average": 8,
      "back": 5,
      "bottom": 3
    },
    "math_a": {
      "subject_name": "數學A",
      "max_score": 15,
      "top": 12,
      "front": 10,
      "average": 7,
      "back": 5,
      "bottom": 3
    },
    "math_b": {
      "subject_name": "數學B",
      "max_score": 15,
      "top": 12,
      "front": 9,
      "average": 6,
      "back": 4,
      "bottom": 3
    },
    "social": {
      "subject_name": "社會",
      "max_score": 15,
      "top": 13,
      "front": 12,
      "average": 10,
      "back": 8,
      "bottom": 6
    },
    "nature": {
      "subject_name": "自然",
      "max_score": 15,
      "top": 13,
      "front": 12,
      "average": 9,
      "back": 6,
      "bottom": 5
    }
  }
}

// 114年學測五標
{
  "_id": ObjectId("..."),
  "academic_year": 114,
  "description": "114學年度學科能力測驗級分標準（全國統一）",
  ...
}
```

### 查詢範例

```javascript
// 查詢特定學年的學測五標
db.assessment_standards.findOne({ academic_year: 113 })

// 查詢國文科的頂標
db.assessment_standards.findOne(
  { academic_year: 113 },
  { "academic_ability_test.chinese.top": 1 }
)

// 獲取所有可用的學年
db.assessment_standards.distinct("academic_year")
```

### 索引設計

```javascript
db.assessment_standards.createIndex({ "academic_year": 1 }, { unique: true })
db.assessment_standards.createIndex({ "last_updated": -1 })
```

---

## Collection 2: bifurcated_standards（分科五標）

### 結構範例

```javascript
// 113年分科五標
{
  "_id": ObjectId("..."),
  "academic_year": 113,
  "description": "113學年度分科測驗級分標準（全國統一）",
  "source": "大考中心公告",
  "last_updated": ISODate("2024-01-15"),
  "bifurcated_exam_standards": {
    "math_a": {
      "subject_name": "數學甲",
      "raw_score_max": 100,
      "level_60_max": 60,
      "top": 46,          // 前12% (60級制)
      "front": 39,        // 前25% (60級制)
      "average": 27,      // 前50% (60級制)
      "back": 16,         // 前75% (60級制)
      "bottom": 11        // 前88% (60級制)
    },
    "math_b": {
      "subject_name": "數學乙",
      "raw_score_max": 100,
      "level_60_max": 60,
      "top": 52,
      "front": 44,
      "average": 30,
      "back": 18,
      "bottom": 12
    },
    "chemistry": {
      "subject_name": "化學",
      "raw_score_max": 100,
      "level_60_max": 60,
      "top": 50,
      "front": 44,
      "average": 32,
      "back": 21,
      "bottom": 15
    },
    "physics": {
      "subject_name": "物理",
      "raw_score_max": 100,
      "level_60_max": 60,
      "top": 52,
      "front": 44,
      "average": 31,
      "back": 20,
      "bottom": 15
    },
    "biology": {
      "subject_name": "生物",
      "raw_score_max": 100,
      "level_60_max": 60,
      "top": 53,
      "front": 47,
      "average": 35,
      "back": 25,
      "bottom": 21
    },
    "history": {
      "subject_name": "歷史",
      "raw_score_max": 100,
      "level_60_max": 60,
      "top": 50,
      "front": 45,
      "average": 38,
      "back": 32,
      "bottom": 27
    },
    "geography": {
      "subject_name": "地理",
      "raw_score_max": 100,
      "level_60_max": 60,
      "top": 53,
      "front": 47,
      "average": 39,
      "back": 31,
      "bottom": 26
    },
    "civic_society": {
      "subject_name": "公民與社會",
      "raw_score_max": 100,
      "level_60_max": 60,
      "top": 50,
      "front": 45,
      "average": 37,
      "back": 30,
      "bottom": 24
    }
  }
}

// 114年分科五標 (8科完整)
{
  "_id": ObjectId("..."),
  "academic_year": 114,
  "description": "114學年度分科測驗級分標準（全國統一）",
  ...
}
```

### 查詢範例

```javascript
// 查詢特定學年的分科五標
db.bifurcated_standards.findOne({ academic_year: 113 })

// 查詢數學甲的頂標
db.bifurcated_standards.findOne(
  { academic_year: 113 },
  { "bifurcated_exam_standards.math_a.top": 1 }
)

// 檢查所有分科科目
const doc = db.bifurcated_standards.findOne({ academic_year: 113 })
Object.keys(doc.bifurcated_exam_standards)
// Output: ["math_a", "math_b", "chemistry", "physics", "biology", "history", "geography", "civic_society"]
```

### 索引設計

```javascript
db.bifurcated_standards.createIndex({ "academic_year": 1 }, { unique: true })
db.bifurcated_standards.createIndex({ "last_updated": -1 })
```

---

## Collection 3: score_conversions（級分轉換表）

### 結構範例

```javascript
// 113年級分轉換表
{
  "_id": ObjectId("..."),
  "academic_year": 113,
  "description": "113學年度學科能力測驗15級分轉換為60級分對照表",
  "source": "大考中心公告",
  "last_updated": ISODate("2024-02-01"),
  "conversion_rules": "15 -> 60, 14 -> 56, 13 -> 52, ... (每級降4分)",
  "gsat_subjects": {
    "chinese": {
      "subject_name": "國文",
      "conversions": {
        "15": 60,
        "14": 56,
        "13": 52,
        "12": 48,
        "11": 44,
        "10": 40,
        "9": 36,
        "8": 32,
        "7": 28,
        "6": 24,
        "5": 20,
        "4": 16,
        "3": 12,
        "2": 8,
        "1": 4,
        "0": 0
      }
    },
    "english": {
      "subject_name": "英文",
      "conversions": {
        "15": 60,
        "14": 56,
        "13": 52,
        ...
      }
    },
    "math_a": {
      "subject_name": "數學A",
      "conversions": { ... }
    },
    "math_b": {
      "subject_name": "數學B",
      "conversions": { ... }
    },
    "social": {
      "subject_name": "社會",
      "conversions": { ... }
    },
    "nature": {
      "subject_name": "自然",
      "conversions": { ... }
    }
  }
}

// 114年級分轉換表
{
  "_id": ObjectId("..."),
  "academic_year": 114,
  ...
}
```

### 查詢範例

```javascript
// 查詢特定學年的轉換表
db.score_conversions.findOne({ academic_year: 113 })

// 將國文15級分轉換為60級分
const conversion = db.score_conversions.findOne({ academic_year: 113 })
const score_60 = conversion.gsat_subjects.chinese.conversions["15"]
console.log(score_60)  // Output: 60

// 查詢所有可用的GSAT科目
const doc = db.score_conversions.findOne({ academic_year: 113 })
Object.keys(doc.gsat_subjects)
// Output: ["chinese", "english", "math_a", "math_b", "social", "nature"]
```

### 索引設計

```javascript
db.score_conversions.createIndex({ "academic_year": 1 }, { unique: true })
db.score_conversions.createIndex({ "last_updated": -1 })
```

---

## Collection 4: departments（科系錄取資訊）

### 結構範例

```javascript
{
  "_id": ObjectId("..."),
  "department_id": "NTNU_001",
  "school_name": "國立臺灣師範大學",
  "department_name": "數學系",
  "admission_year": 113,
  "admission_method": "繁星推薦",  // or "個人申請", "考試分發"
  
  "statistics": {
    "admission_count": 5,           // 錄取人數
    "applicant_count": 45,          // 報名人數
    "admission_ratio": 0.111,       // 錄取率
    
    "gsat": {
      "total_weighted_score": {
        "min": 285,
        "max": 360,
        "mean": 315.4,
        "median": 316,
        "std_dev": 18.5
      },
      "individual_subjects": {
        "chinese": { "min": 12, "max": 15, "mean": 13.2 },
        "english": { "min": 10, "max": 15, "mean": 13.4 },
        "math_a": { "min": 11, "max": 15, "mean": 13.1 },
        "math_b": null,
        "social": { "min": 9, "max": 15, "mean": 12.8 },
        "nature": { "min": 11, "max": 15, "mean": 13.5 }
      }
    },
    
    "bifurcated": {
      "total_weighted_score": {
        "min": 45,
        "max": 56,
        "mean": 51.2,
        "median": 52,
        "std_dev": 3.5
      },
      "individual_subjects": {
        "math_a": { "min": 42, "max": 58, "mean": 52.1 },
        "chemistry": { "min": 40, "max": 56, "mean": 50.8 },
        "biology": null
      }
    }
  },
  
  "requirements": {
    "required_subjects": ["chinese", "english", "math_a", "social", "nature"],
    "test_type": "gsat",  // "gsat" or "bifurcated"
    "gsat_weights": {
      "chinese": 1,
      "english": 1,
      "math_a": 2,
      "social": 1,
      "nature": 1
    }
  },
  
  "last_updated": ISODate("2024-12-15"),
  "data_quality": {
    "completeness": 0.95,
    "confidence_level": "high"  // "high", "medium", "low"
  }
}
```

### 查詢範例

```javascript
// 查詢師大數學系113年的錄取統計
db.departments.findOne({
  "school_name": "國立臺灣師範大學",
  "department_name": "數學系",
  "admission_year": 113
})

// 查詢所有考科A科系
db.departments.find({ "requirements.test_type": "bifurcated" })

// 查詢平均加權分數在300-320的科系
db.departments.find({
  "statistics.gsat.total_weighted_score.mean": { $gte: 300, $lte: 320 }
})
```

### 索引設計

```javascript
db.departments.createIndex({ "school_name": 1, "department_name": 1 })
db.departments.createIndex({ "admission_year": 1 })
db.departments.createIndex({ "statistics.gsat.total_weighted_score.mean": 1 })
db.departments.createIndex({ "requirements.test_type": 1 })
db.departments.createIndex({ "last_updated": -1 })
```

---

## Collection 5: placement_analysis_cache（落點分析快取）

### 結構範例

```javascript
{
  "_id": ObjectId("..."),
  "user_session_id": "user_12345_session_1",
  "analysis_id": "analysis_20260111_001",
  
  "input_scores": {
    "academic_year": 113,
    "gsat_scores_15_level": {
      "chinese": 13,
      "english": 12,
      "math_a": 14,
      "math_b": null,
      "social": 12,
      "nature": 13
    },
    "bifurcated_scores_60_level": {
      "math_a": 48,
      "chemistry": 45,
      "biology": null
    }
  },
  
  "converted_scores": {
    "gsat_scores_60_level": {
      "chinese": 52,
      "english": 48,
      "math_a": 56,
      "social": 48,
      "nature": 52
    },
    "bifurcated_scores_60_level": {
      "math_a": 48,
      "chemistry": 45
    }
  },
  
  "analysis_results": {
    "total_results": 142,
    "results_by_likelihood": {
      "high_confidence": {
        "min_probability": 0.7,
        "count": 23,
        "departments": [
          {
            "department_id": "NTNU_001",
            "school_name": "國立臺灣師範大學",
            "department_name": "數學系",
            "admission_method": "繁星推薦",
            "probability": 0.85,
            "user_score_vs_historical": {
              "gsat_weighted_percentile": 0.78,
              "comparison": "above"  // "above", "at", "below"
            }
          },
          ...
        ]
      },
      "medium_confidence": {
        "min_probability": 0.4,
        "max_probability": 0.7,
        "count": 78,
        "departments": [...]
      },
      "low_confidence": {
        "max_probability": 0.4,
        "count": 41,
        "departments": [...]
      }
    }
  },
  
  "metadata": {
    "created_at": ISODate("2026-01-11T10:30:00Z"),
    "processing_time_ms": 245,
    "algorithm_version": "v1.0",
    "cached_duration": 3600  // 1 hour
  }
}
```

### 查詢範例

```javascript
// 查詢使用者的分析歷史
db.placement_analysis_cache.find({ "user_session_id": "user_12345_session_1" })

// 查詢今天的所有分析
db.placement_analysis_cache.find({
  "created_at": {
    $gte: ISODate("2026-01-11T00:00:00Z"),
    $lt: ISODate("2026-01-12T00:00:00Z")
  }
})

// 查詢高信心度的科系數量
const analysis = db.placement_analysis_cache.findOne({ "analysis_id": "analysis_20260111_001" })
console.log(analysis.analysis_results.results_by_likelihood.high_confidence.count)
```

### 索引設計

```javascript
db.placement_analysis_cache.createIndex({ "user_session_id": 1 })
db.placement_analysis_cache.createIndex({ "created_at": -1 }, { expireAfterSeconds: 86400 })
db.placement_analysis_cache.createIndex({ "analysis_id": 1 }, { unique: true })
```

---

## 完整初始化指令集

```javascript
// 連接資料庫
use unihow_admission_db

// 建立所有 collections
db.createCollection("assessment_standards")
db.createCollection("bifurcated_standards")
db.createCollection("score_conversions")
db.createCollection("departments")
db.createCollection("placement_analysis_cache")

// 建立所有索引
db.assessment_standards.createIndex({ "academic_year": 1 }, { unique: true })
db.assessment_standards.createIndex({ "last_updated": -1 })

db.bifurcated_standards.createIndex({ "academic_year": 1 }, { unique: true })
db.bifurcated_standards.createIndex({ "last_updated": -1 })

db.score_conversions.createIndex({ "academic_year": 1 }, { unique: true })
db.score_conversions.createIndex({ "last_updated": -1 })

db.departments.createIndex({ "school_name": 1, "department_name": 1 })
db.departments.createIndex({ "admission_year": 1 })
db.departments.createIndex({ "statistics.gsat.total_weighted_score.mean": 1 })
db.departments.createIndex({ "requirements.test_type": 1 })
db.departments.createIndex({ "last_updated": -1 })

db.placement_analysis_cache.createIndex({ "user_session_id": 1 })
db.placement_analysis_cache.createIndex({ "created_at": -1 }, { expireAfterSeconds: 86400 })
db.placement_analysis_cache.createIndex({ "analysis_id": 1 }, { unique: true })

// 驗證所有 collections
db.getCollectionNames()
```

---

## 數據流圖

```
用戶輸入成績 (15級GSAT + 60級分科)
    ↓
檢查 Five Standards 門檻
    ├─ assessment_standards (113/114年學測五標)
    └─ bifurcated_standards (113/114年分科五標)
    ↓
級分轉換 (15→60)
    └─ score_conversions (113/114年轉換表)
    ↓
計算加權分數
    ↓
與歷年科系統計比較
    └─ departments (各科系的歷年錄取統計)
    ↓
生成落點分析結果
    ↓
快取結果
    └─ placement_analysis_cache
    ↓
返回給用戶: 高/中/低信心度科系列表
```

---

## 資料匯入順序

建議按照以下順序匯入資料：

1. **assessment_standards** ← 從 `assessment_standards_113.json` 和 `assessment_standards_114.json`
2. **bifurcated_standards** ← 從 `bifurcated_standards_113.json` 和 `bifurcated_standards_114.json`
3. **score_conversions** ← 從 `score_conversion_113.json` 和 `score_conversion_114.json`
4. **departments** ← 從現有的 MongoDB 或 JSON 檔案（需要從 database-backup/admission_db.schools.json 或活躍資料庫提取）
5. **placement_analysis_cache** ← 空初始化（在系統使用時自動填充）

---

## 查詢效能建議

```javascript
// 高效查詢：根據學年度快速獲取五標
db.assessment_standards.findOne({ academic_year: 113 })  // 毫秒級

// 高效查詢：基於科系名稱和年份查詢錄取統計
db.departments
  .find({ admission_year: 113 })
  .skip(0)
  .limit(50)
  .explain("executionStats")

// 利用索引快速查詢分數範圍內的科系
db.departments.find({
  "statistics.gsat.total_weighted_score.mean": {
    $gte: 300,
    $lte: 350
  }
})
```

