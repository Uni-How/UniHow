# 🚀 系統初始化清單

## Phase 1.4: MongoDB 資料庫建立 ✅ 已完成設計

### 已完成的工作

#### ✅ 資料收集 (100%)
- [x] 113年學測五標 (assessment_standards_113.json)
- [x] 114年學測五標 (assessment_standards_114.json)
- [x] 113年分科五標 (bifurcated_standards_113.json)
- [x] 114年分科五標 (bifurcated_standards_114.json)
- [x] 113年級分轉換表 (score_conversion_113.json)
- [x] 114年級分轉換表 (score_conversion_114.json)

#### ✅ API 開發 (100%)
- [x] POST `/api/placement-analysis` - 主要落點分析
- [x] GET `/api/standards` - 五標查詢
- [x] GET/POST `/api/score-conversion` - 級分轉換
- [x] GET/POST `/api/departments-stats` - 科系統計
- [x] GET `/api/db-health` - 資料庫健康檢查
- [x] POST `/api/db-seed` - 資料庫初始化

#### ✅ 文檔
- [x] DATABASE_SCHEMA_EXAMPLE.md - 完整資料庫結構範例
- [x] API_INTEGRATION_GUIDE.md - 前端集成指南

---

## 🎯 立即可執行的步驟

### 第一步：啟動開發服務器

```bash
cd /Users/brianlu/Documents/UniHow/admission-frontend-web
npm run dev
```

預期輸出：
```
▲ Next.js 15.x.x
- ready on 0.0.0.0:3000 (0.0.0.0:3000)
```

### 第二步：驗證資料庫連接

```bash
# 打開新的終端窗口
curl http://localhost:3000/api/db-health

# 預期回應：
# {
#   "status": "degraded" 或 "unhealthy" (因為還沒有資料)
#   "details": { ... }
# }
```

### 第三步：初始化資料庫 (無需管理員密鑰在開發環境)

```bash
# 開發環境
curl -X POST http://localhost:3000/api/db-seed \
  -H "Content-Type: application/json" \
  -d '{
    "collections": [
      "assessment_standards_113",
      "assessment_standards_114",
      "bifurcated_standards_113",
      "bifurcated_standards_114",
      "score_conversion_113",
      "score_conversion_114"
    ],
    "clear_first": false
  }'

# 預期回應：
# {
#   "success": true,
#   "seed_results": { ... },
#   "health_check": {
#     "assessment_standards": { "document_count": 2, "ready": true },
#     ...
#   }
# }
```

### 第四步：再次驗證資料庫健康狀況

```bash
curl http://localhost:3000/api/db-health

# 預期回應：
# {
#   "status": "healthy",
#   "details": {
#     "data_completeness": {
#       "gsat_standards": { "available_years": [113, 114], "complete": true },
#       "bifurcated_standards": { "available_years": [113, 114], "complete": true },
#       "score_conversions": { "available_years": [113, 114], "complete": true }
#     }
#   }
# }
```

### 第五步：測試落點分析 API

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

# 預期回應：
# {
#   "success": true,
#   "analysis_id": "analysis_...",
#   "total_results": 142,
#   "results_by_likelihood": {
#     "high_confidence": { "count": X, "departments": [...] },
#     "medium_confidence": { "count": Y, "departments": [...] },
#     "low_confidence": { "count": Z, "departments": [...] }
#   }
# }
```

---

## 📊 系統架構驗證清單

### MongoDB Collections
- [ ] `assessment_standards` - 2 documents (113, 114年)
- [ ] `bifurcated_standards` - 2 documents (113, 114年)
- [ ] `score_conversions` - 2 documents (113, 114年)
- [ ] `departments` - 需要從現有資料庫或 backup 匯入
- [ ] `placement_analysis_cache` - 自動生成

### API 端點狀態
- [ ] GET `/api/standards` - 回傳五標資料
- [ ] GET `/api/score-conversion` - 回傳轉換後的級分
- [ ] POST `/api/score-conversion` - 批量轉換級分
- [ ] GET `/api/departments-stats` - 回傳科系統計
- [ ] POST `/api/departments-stats` - 查詢學校/科系列表
- [ ] POST `/api/placement-analysis` - 執行完整分析
- [ ] GET `/api/db-health` - 檢查系統健康狀況
- [ ] POST `/api/db-seed` - 初始化資料

### 資料完整性
- [ ] 學測五標包含全部 6 科
- [ ] 分科五標包含全部 7-8 科
- [ ] 級分轉換表覆蓋全部 6 科 × 16 級分
- [ ] 科系錄取統計完整

---

## ⚠️ 已知需要完成的任務

### Phase 2: 科系統計資料匯入
**狀態**: ⏳ 未開始

需要從以下來源獲取資料：
1. 現有 MongoDB (需要備份和提取)
2. [database-backup/admission_db.schools.json](database-backup/admission_db.schools.json)
3. [資料JSON檔/cleaned_data/](資料JSON檔/cleaned_data/)

**工作項目**:
- [ ] 提取 2-3 年的歷年錄取資料
- [ ] 計算統計特性 (min, max, mean, median, std_dev)
- [ ] 標記資料品質指標
- [ ] 匯入到 `departments` collection

**預計時間**: 2-3 天

### Phase 3: 後端 API 額外功能
**狀態**: ⏳ 未開始

**任務**:
- [ ] 實現分頁機制 (pagination)
- [ ] 新增搜尋和篩選
- [ ] 實現結果匯出功能
- [ ] 新增使用者歷史記錄

**預計時間**: 2-3 天

### Phase 4: 前端實現
**狀態**: ⏳ 未開始

**現有元件**:
- HeroSearch.tsx - 需要更新以支持新API
- CompactSearchBar.tsx - 需要適配
- SchoolCard.tsx - 需要改進

**需要建立的元件**:
- [ ] PlacementAnalysisForm - 成績輸入表單
- [ ] ResultsDisplay - 結果展示
- [ ] ConfidenceGrouping - 信心度分組
- [ ] DepartmentCard - 科系卡片
- [ ] Loading/Error 狀態

**預計時間**: 3-4 天

### Phase 5: 測試與驗證
**狀態**: ⏳ 未開始

**測試項目**:
- [ ] 單元測試 (Unit Tests)
- [ ] 端對端測試 (E2E Tests)
- [ ] 效能測試
- [ ] 使用者驗收測試

**預計時間**: 2-3 天

---

## 🔧 故障排除指南

### 問題 1: 無法連接到 MongoDB

**症狀**: 
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**解決方案**:
```bash
# 確保 MongoDB 運行中
brew services list  # macOS

# 啟動 MongoDB
brew services start mongodb-community  # macOS
```

### 問題 2: 資料庫為空

**症狀**:
```json
{ "status": "degraded", "details": { "collections": { "assessment_standards": { "document_count": 0 } } } }
```

**解決方案**:
```bash
# 重新執行 db-seed
curl -X POST http://localhost:3000/api/db-seed \
  -H "Content-Type: application/json" \
  -d '{ "clear_first": true, "collections": ["assessment_standards_113", ...] }'
```

### 問題 3: 分析返回 0 結果

**症狀**:
```json
{ "total_results": 0 }
```

**原因**: `departments` collection 為空

**解決方案**:
```bash
# 需要從 backup 匯入科系資料
# 將 database-backup/admission_db.schools.json 匯入
mongoimport --db unihow_admission_db --collection departments --file database-backup/admission_db.schools.json
```

---

## 📈 效能基準 (Performance Baseline)

期望的 API 響應時間：

| API 端點 | 預期時間 | 說明 |
|---------|---------|------|
| GET /api/standards | < 50ms | 直接查詢 |
| POST /api/placement-analysis | 500-1500ms | 複雜計算 |
| GET /api/departments-stats | < 200ms | 分頁查詢 |
| GET /api/db-health | < 100ms | 簡單驗證 |

---

## 🎓 下一步行動

### 優先級 1（立即行動）
1. ✅ 驗證所有 JSON 檔案格式（已完成）
2. ✅ 創建所有 API 端點（已完成）
3. ⏭️ 啟動開發服務器並測試

### 優先級 2（本周）
1. 從現有資料庫提取科系統計資料
2. 匯入到 `departments` collection
3. 測試完整的落點分析流程

### 優先級 3（下周）
1. 構建前端分析表單
2. 實現結果展示頁面
3. 整合所有 API 調用

---

## ✨ 成功指標

系統完全就緒的標誌：

- [x] 所有 JSON 檔案已建立
- [x] 所有 API 端點已實現
- [ ] 資料庫初始化成功
- [ ] 落點分析 API 返回結果（≥ 100 個科系）
- [ ] 前端正確顯示分析結果
- [ ] 所有 API 端點檢驗通過
- [ ] 效能指標達到基準

---

## 📞 支援和文檔

- 資料庫結構: 見 [DATABASE_SCHEMA_EXAMPLE.md](DATABASE_SCHEMA_EXAMPLE.md)
- API 文檔: 見 [API_INTEGRATION_GUIDE.md](API_INTEGRATION_GUIDE.md)
- 系統設計: 見 [PLACEMENT_ANALYSIS_PLANNING_V2.md](PLACEMENT_ANALYSIS_PLANNING_V2.md)

