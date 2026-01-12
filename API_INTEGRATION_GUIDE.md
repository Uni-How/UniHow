# API 文檔與前端集成指南

## 完成的 API 端點列表

### 1. **落點分析主要端點** 📊
**POST** `/api/placement-analysis`

**功能**: 根據使用者成績進行完整的落點分析

**請求範例**:
```javascript
fetch('/api/placement-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    academic_year: 113,
    test_type: 'gsat',
    gsat_scores: {
      chinese: 13,
      english: 12,
      math_a: 14,
      math_b: null,
      social: 12,
      nature: 13
    }
  })
})
```

**回應範例**:
```json
{
  "success": true,
  "analysis_id": "analysis_2026-01-11T10:30:00.000Z_abc123",
  "total_results": 142,
  "results_by_likelihood": {
    "high_confidence": {
      "count": 23,
      "departments": [
        {
          "department_id": "NTNU_001",
          "school_name": "國立臺灣師範大學",
          "department_name": "數學系",
          "admission_method": "繁星推薦",
          "user_score_vs_historical": {
            "percentile": 78,
            "comparison": "above"
          },
          "probability": 0.85,
          "pass_threshold_check": true,
          "threshold_details": {
            "required_subjects": ["chinese", "english", "math_a", "social", "nature"],
            "all_pass": true
          }
        }
      ]
    },
    "medium_confidence": {
      "count": 78,
      "departments": [...]
    },
    "low_confidence": {
      "count": 41,
      "departments": [...]
    }
  },
  "input_validation": {
    "passed_threshold_check": true,
    "threshold_details": {
      "chinese": { "pass": true, ... },
      "english": { "pass": true, ... }
    }
  }
}
```

**處理流程**:
1. ✅ 驗證輸入格式
2. ✅ 檢查五標門檻
3. ✅ 轉換 15→60 級分（GSAT）
4. ✅ 計算加權分數
5. ✅ 與歷年統計比較
6. ✅ 計算概率 (使用正態分佈)
7. ✅ 結果分類排序
8. ✅ 快取分析結果

---

### 2. **五標資料查詢** 📋
**GET** `/api/standards?year=113&type=gsat`

**參數**:
- `year`: 113 或 114
- `type`: "gsat" 或 "bifurcated"

**回應**:
```json
{
  "success": true,
  "data": {
    "academic_year": 113,
    "description": "113學年度學科能力測驗級分標準",
    "academic_ability_test": {
      "chinese": {
        "subject_name": "國文",
        "max_score": 15,
        "top": 13,
        "front": 12,
        "average": 11,
        "back": 9,
        "bottom": 8
      },
      ...
    }
  }
}
```

**前端用途**:
- 顯示五標參考值
- 驗證使用者輸入是否符合基本標準
- 初始化下拉菜單

---

### 3. **級分轉換 API** 🔄
**GET** `/api/score-conversion?year=113&subject=chinese&level=13`

**參數**:
- `year`: 113 或 114
- `subject`: chinese, english, math_a, math_b, social, nature
- `level`: 0-15

**回應**:
```json
{
  "success": true,
  "data": {
    "academic_year": 113,
    "subject": "chinese",
    "level_15": 13,
    "level_60": 52,
    "conversion_rule": "15→60: each grade decreases by 4 points"
  }
}
```

**批量轉換** (POST):
```javascript
fetch('/api/score-conversion', {
  method: 'POST',
  body: JSON.stringify({
    academic_year: 113,
    conversions: [
      { subject: 'chinese', level_15: 13 },
      { subject: 'english', level_15: 12 },
      { subject: 'math_a', level_15: 14 }
    ]
  })
})
```

---

### 4. **科系統計資訊** 📍
**GET** `/api/departments-stats?year=113&school=國立臺灣師範大學&limit=50`

**參數**:
- `year`: 113 或 114
- `school`: (可選) 學校名稱
- `department`: (可選) 科系名稱
- `limit`: (可選) 回傳數量上限，預設 50

**回應**:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "department_id": "NTNU_001",
      "school_name": "國立臺灣師範大學",
      "department_name": "數學系",
      "admission_method": "繁星推薦",
      "statistics": {
        "gsat": {
          "total_weighted_score": {
            "min": 285,
            "max": 360,
            "mean": 315.4,
            "median": 316,
            "std_dev": 18.5
          }
        }
      },
      "requirements": {
        "required_subjects": ["chinese", "english", "math_a", "social", "nature"],
        "test_type": "gsat"
      }
    }
  ]
}
```

**搜尋學校 (POST)**:
```javascript
fetch('/api/departments-stats', {
  method: 'POST',
  body: JSON.stringify({
    action: 'get_schools',
    academic_year: 113
  })
})
// Response: { "success": true, "schools": ["國立臺灣大學", "國立臺灣師範大學", ...] }
```

---

### 5. **資料庫健康檢查** 🏥
**GET** `/api/db-health`

**回應**:
```json
{
  "status": "healthy",
  "details": {
    "database_connected": true,
    "collections": {
      "assessment_standards": {
        "exists": true,
        "document_count": 2,
        "has_data": true
      },
      "bifurcated_standards": {
        "exists": true,
        "document_count": 2,
        "has_data": true
      },
      "score_conversions": {
        "exists": true,
        "document_count": 2,
        "has_data": true
      },
      "departments": {
        "exists": true,
        "document_count": 1200,
        "has_data": true
      }
    },
    "data_completeness": {
      "gsat_standards": {
        "available_years": [113, 114],
        "complete": true
      },
      "bifurcated_standards": {
        "available_years": [113, 114],
        "complete": true
      },
      "score_conversions": {
        "available_years": [113, 114],
        "complete": true
      }
    },
    "timestamp": "2026-01-11T10:30:00.000Z"
  }
}
```

**用途**:
- 應用啟動檢查
- 監控面板
- 故障診斷

---

### 6. **資料庫初始化** 🔧
**POST** `/api/db-seed`

**Headers**:
```javascript
{
  'X-Admin-Key': process.env.ADMIN_KEY  // 生產環境需要
}
```

**請求體**:
```javascript
{
  "collections": [
    "assessment_standards_113",
    "assessment_standards_114",
    "bifurcated_standards_113",
    "bifurcated_standards_114",
    "score_conversion_113",
    "score_conversion_114"
  ],
  "clear_first": false
}
```

**回應**:
```json
{
  "success": true,
  "seed_results": {
    "assessment_standards_113": {
      "status": "success",
      "action": "inserted",
      "inserted_id": "...",
      "file": "assessment_standards_113.json"
    },
    ...
  },
  "health_check": {
    "assessment_standards": { "document_count": 2, "ready": true },
    "bifurcated_standards": { "document_count": 2, "ready": true },
    "score_conversions": { "document_count": 2, "ready": true }
  }
}
```

---

## 前端集成指南

### 設置環境變數 (.env.local)

```bash
# 開發環境
NEXT_PUBLIC_API_URL=http://localhost:3000

# 生產環境
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

### 建立 API 客戶端 (lib/api-client.ts)

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function placementAnalysis(data: {
  academic_year: number;
  test_type: string;
  gsat_scores?: any;
  bifurcated_scores?: any;
}) {
  const response = await fetch(`${API_URL}/api/placement-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) throw new Error('Analysis failed');
  return response.json();
}

export async function getStandards(year: number, type: string) {
  const response = await fetch(
    `${API_URL}/api/standards?year=${year}&type=${type}`
  );
  
  if (!response.ok) throw new Error('Failed to fetch standards');
  return response.json();
}

export async function convertScore(year: number, subject: string, level: number) {
  const response = await fetch(
    `${API_URL}/api/score-conversion?year=${year}&subject=${subject}&level=${level}`
  );
  
  if (!response.ok) throw new Error('Conversion failed');
  return response.json();
}

export async function getDepartmentsStats(year: number, school?: string) {
  const url = new URL(`${API_URL}/api/departments-stats`);
  url.searchParams.set('year', year.toString());
  if (school) url.searchParams.set('school', school);
  
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

export async function dbHealthCheck() {
  const response = await fetch(`${API_URL}/api/db-health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}
```

### React Component 範例

```typescript
import { useState } from 'react';
import { placementAnalysis } from '@/lib/api-client';

export default function PlacementSearchForm() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [gsat, setGsat] = useState({
    chinese: 13,
    english: 12,
    math_a: 14,
    social: 12,
    nature: 13
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await placementAnalysis({
        academic_year: 113,
        test_type: 'gsat',
        gsat_scores: gsat
      });
      
      setResults(response);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('分析失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          min="0"
          max="15"
          value={gsat.chinese}
          onChange={(e) => setGsat({...gsat, chinese: parseInt(e.target.value)})}
          placeholder="國文"
        />
        {/* 其他科目輸入欄位 */}
        
        <button type="submit" disabled={loading}>
          {loading ? '分析中...' : '分析落點'}
        </button>
      </form>

      {results && (
        <div>
          <h3>高信心度 ({results.results_by_likelihood.high_confidence.count})</h3>
          {results.results_by_likelihood.high_confidence.departments.map((dept: any) => (
            <div key={dept.department_id}>
              <h4>{dept.school_name} - {dept.department_name}</h4>
              <p>機率: {(dept.probability * 100).toFixed(1)}%</p>
              <p>百分位: {dept.user_score_vs_historical.percentile}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 完整初始化流程

### 步驟 1: 驗證資料庫連接

```bash
curl http://localhost:3000/api/db-health
```

### 步驟 2: 初始化資料

```bash
curl -X POST http://localhost:3000/api/db-seed \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your-admin-key" \
  -d '{
    "collections": [
      "assessment_standards_113",
      "assessment_standards_114",
      "bifurcated_standards_113",
      "bifurcated_standards_114",
      "score_conversion_113",
      "score_conversion_114"
    ]
  }'
```

### 步驟 3: 驗證初始化成功

```bash
curl http://localhost:3000/api/db-health
# 應該看到所有 collections 的 document_count > 0
```

### 步驟 4: 測試落點分析

```bash
curl -X POST http://localhost:3000/api/placement-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "academic_year": 113,
    "test_type": "gsat",
    "gsat_scores": {
      "chinese": 13,
      "english": 12,
      "math_a": 14,
      "social": 12,
      "nature": 13
    }
  }'
```

---

## 錯誤處理

所有 API 端點都遵循以下錯誤回應格式：

```json
{
  "error": "Error message",
  "details": "詳細資訊 (開發環境)",
  "timestamp": "2026-01-11T10:30:00.000Z"
}
```

### 常見錯誤碼

| 碼 | 說明 | 解決方案 |
|---|------|--------|
| 400 | Bad Request | 檢查請求格式和參數 |
| 403 | Forbidden | 檢查管理員金鑰 |
| 404 | Not Found | 資料不存在，執行初始化 |
| 500 | Server Error | 檢查伺服器日誌 |
| 503 | Service Unavailable | 資料庫未連接 |

---

## 效能優化建議

1. **快取分析結果**: 使用 placement_analysis_cache collection 避免重複計算
2. **批量查詢**: 使用 `/api/score-conversion` POST 端點批量轉換
3. **限制結果**: 使用 `limit` 參數避免一次回傳過多資料
4. **CDN 部署**: 靜態資源使用 CDN 加速

---

## 監控和日誌

建議監控以下 API：
- `/api/db-health` - 每 5 分鐘檢查一次
- `/api/placement-analysis` - 記錄所有分析請求
- `/api/db-seed` - 記錄所有初始化操作

---

## 後續優化項目

- [ ] 實現分頁機制
- [ ] 新增搜尋和篩選功能
- [ ] 實現使用者歷史記錄
- [ ] 新增匯出功能 (CSV/PDF)
- [ ] 整合分布表分析

