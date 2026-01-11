# ⚡ 快速開始指南

## 5 分鐘快速啟動

### 1️⃣ 啟動開發服務器

```bash
cd /Users/brianlu/Documents/UniHow/admission-frontend-web
npm run dev
```

輸出應顯示：
```
▲ Next.js 15.x.x
- ready on 0.0.0.0:3000
```

### 2️⃣ 驗證系統 (新終端窗口)

```bash
# 檢查資料庫連接
curl http://localhost:3000/api/db-health

# 預期看到：
# { "status": "degraded" 或 "unhealthy" }
# (因為還沒初始化資料)
```

### 3️⃣ 初始化資料庫

```bash
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
    ]
  }'
```

如果成功，應看到：
```json
{
  "success": true,
  "seed_results": {
    "assessment_standards_113": {"status": "success", "action": "inserted"},
    ...
  }
}
```

### 4️⃣ 驗證初始化

```bash
curl http://localhost:3000/api/db-health
```

預期看到：
```json
{
  "status": "healthy",
  "details": {
    "data_completeness": {
      "gsat_standards": {"available_years": [113, 114], "complete": true},
      "bifurcated_standards": {"available_years": [113, 114], "complete": true},
      "score_conversions": {"available_years": [113, 114], "complete": true}
    }
  }
}
```

### 5️⃣ 測試落點分析

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

✅ 完成！系統已就緒

---

## 🔍 完整驗證腳本

執行自動化測試：

```bash
./scripts/verify-api.sh
```

或指定 API URL：

```bash
./scripts/verify-api.sh http://localhost:3000
```

預期輸出：
```
🚀 UniHow 落點分析系統驗證
==================================
測試: 健康檢查 ... ✓ 通過 (HTTP 200)
測試: 查詢 113 年學測五標 ... ✓ 通過 (HTTP 200)
...
==================================
✓ 通過: 11
✗ 失敗: 0
🎉 所有測試通過！
```

---

## 🗂️ 專案結構

```
admission-frontend-web/
├── app/
│   ├── api/
│   │   ├── placement-analysis/       ✅ 落點分析
│   │   ├── standards/                ✅ 五標查詢
│   │   ├── score-conversion/         ✅ 級分轉換
│   │   ├── departments-stats/        ✅ 科系統計
│   │   ├── db-health/                ✅ 健康檢查
│   │   └── db-seed/                  ✅ 資料初始化
│   ├── page.tsx                      主頁
│   └── layout.tsx                    版面
├── components/
│   ├── HeroSearch.tsx                搜尋表單 (待更新)
│   └── ...
├── JSON/
│   └── configs/                      ✅ 所有 JSON 設定檔
├── lib/
│   └── mongodb.ts                    資料庫連接
├── scripts/
│   └── verify-api.sh                 ✅ API 驗證腳本
├── DATABASE_SCHEMA_EXAMPLE.md         ✅ 資料庫文檔
├── API_INTEGRATION_GUIDE.md           ✅ API 整合指南
└── SYSTEM_INITIALIZATION_CHECKLIST.md ✅ 初始化清單
```

---

## 📝 API 快速參考

### 查詢五標

```bash
# 學測五標
curl http://localhost:3000/api/standards?year=113&type=gsat

# 分科五標
curl http://localhost:3000/api/standards?year=114&type=bifurcated
```

### 轉換級分

```bash
# 單一轉換
curl 'http://localhost:3000/api/score-conversion?year=113&subject=chinese&level=13'

# 批量轉換
curl -X POST http://localhost:3000/api/score-conversion \
  -d '{"academic_year":113,"conversions":[{"subject":"chinese","level_15":13}]}'
```

### 查詢科系

```bash
# 獲取所有科系統計
curl http://localhost:3000/api/departments-stats?year=113

# 查詢學校列表
curl -X POST http://localhost:3000/api/departments-stats \
  -d '{"action":"get_schools","academic_year":113}'
```

### 執行分析

```bash
# GSAT 分析
curl -X POST http://localhost:3000/api/placement-analysis \
  -d '{
    "academic_year":113,
    "test_type":"gsat",
    "gsat_scores":{"chinese":13,"english":12,"math_a":14,"social":12,"nature":13}
  }'

# 分科分析
curl -X POST http://localhost:3000/api/placement-analysis \
  -d '{
    "academic_year":113,
    "test_type":"bifurcated",
    "bifurcated_scores":{"math_a":48,"chemistry":45}
  }'
```

---

## ✨ 下一步

完成初始化後，您可以：

1. **開發前端**
   - 更新 `HeroSearch.tsx` 呼叫 API
   - 建立結果展示頁面
   - 實現結果分類 UI

2. **匯入科系資料**
   - 從 `database-backup/admission_db.schools.json` 提取科系資訊
   - 匯入到 `departments` collection
   - 執行第二次 `db-seed` 以更新科系資料

3. **測試完整流程**
   - 從輸入 → 分析 → 結果展示
   - 驗證概率計算
   - 檢查結果排序

---

## 🆘 常見問題

### Q: 訪問 localhost:3000 顯示連接被拒絕
**A:** 確保 Next.js 服務器運行中：
```bash
npm run dev
# 檢查終端輸出中的 "ready on" 消息
```

### Q: API 返回 500 錯誤
**A:** 檢查伺服器日誌：
```bash
# 在 npm run dev 的終端中查看錯誤消息
```

### Q: db-health 顯示 "unhealthy"
**A:** 執行資料庫初始化：
```bash
curl -X POST http://localhost:3000/api/db-seed \
  -H "Content-Type: application/json" \
  -d '{"collections":["assessment_standards_113","assessment_standards_114","bifurcated_standards_113","bifurcated_standards_114","score_conversion_113","score_conversion_114"]}'
```

### Q: 分析返回 0 結果
**A:** 需要匯入科系資料到 `departments` collection
（待後續完成 Phase 2）

---

## 📚 完整文檔

- [資料庫結構](DATABASE_SCHEMA_EXAMPLE.md)
- [API 整合指南](API_INTEGRATION_GUIDE.md)
- [初始化清單](SYSTEM_INITIALIZATION_CHECKLIST.md)
- [系統設計](PLACEMENT_ANALYSIS_PLANNING_V2.md)

---

## 🎉 系統已準備好！

所有核心 API 已實現，資料已準備就緒。

下一步：啟動服務器並開始集成前端！

```bash
npm run dev
```

