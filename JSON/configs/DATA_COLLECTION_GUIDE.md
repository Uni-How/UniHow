# 落點分析系統資料收集指南

## 📋 資料清單

### ✅ 已完成
- [x] 114年學測五標資料 (`assessment_standards_114.json`)

### ❌ 待收集
- [ ] 113年學測五標資料
- [ ] 113年學測15→60級分轉換表
- [ ] 114年學測15→60級分轉換表

---

## 1️⃣ 學測五標資料收集

### 資料來源
- **官方來源**：大考中心 https://www.ceec.edu.tw/
- **路徑**：統計資料 → 學科能力測驗 → 各科成績人數百分比累計表
- **或**：113/114學年度招生簡章附錄

### 需要的資料（每個學年度）
六個科目的五標級分：
- 國文（chinese）
- 英文（english）
- 數學A（math_a）
- 數學B（math_b）
- 社會（social）
- 自然（nature）

每科五個標準：
- 頂標（top）：前12%考生的最低級分
- 前標（front）：前25%考生的最低級分
- 均標（average）：前50%考生的最低級分
- 後標（back）：前75%考生的最低級分
- 底標（bottom）：前88%考生的最低級分

### 資料範例（從大考中心網站）
```
113學年度學科能力測驗成績標準
科目    頂標  前標  均標  後標  底標
國文    13    12    10    8     6
英文    13    12    9     7     5
數學A   12    10    7     5     3
數學B   12    10    8     6     4
社會    13    12    10    8     6
自然    13    11    9     7     5
```

### 填入檔案
1. 開啟 `assessment_standards_113.json`
2. 將各科目的五標級分填入對應欄位
3. 更新 `last_updated` 日期
4. 移除 `note` 欄位（表示已完成）

---

## 2️⃣ 學測15→60級分轉換表收集

### 資料來源
- **官方來源**：大學考試入學分發委員會
- **網址**：https://www.uac.edu.tw/
- **路徑**：統計資料 → 考試分發 → 級分對照表
- **檔案名稱**：「113/114學年度學科能力測驗與考試分發採計科目對照表」

### 需要的資料（每個學年度）
六個科目的15級分→60級分對照：
- 國文、英文、數學A、數學B、社會、自然

每科16個級分（0-15）對應的60級分

### 資料範例（示意）
```
學測級分  →  60級分
  15     →    60
  14     →    56
  13     →    52
  12     →    48
  11     →    44
  10     →    40
   9     →    36
   8     →    32
   7     →    28
   6     →    24
   5     →    20
   4     →    16
   3     →    12
   2     →     8
   1     →     4
   0     →     0
```

**重要提醒**：
1. 不同科目的對照可能不同（如社會、自然可能有特殊轉換）
2. 需要分別查詢各科目的對照表
3. 確認是「考試分發」用的60級分轉換，不是「申請入學」的級分

### 填入檔案
1. 開啟 `score_conversion_113_template.json` 或 `score_conversion_114_template.json`
2. 將各科目各級分的對照填入 `level_60` 欄位
3. 更新 `release_date` 日期
4. 移除 `note` 欄位（表示已完成）
5. 將檔名改為 `score_conversion_113.json` / `score_conversion_114.json`

---

## 3️⃣ 資料驗證

### 檢查清單
- [ ] 所有數值都已填入（無 null）
- [ ] 五標順序正確：頂標 ≥ 前標 ≥ 均標 ≥ 後標 ≥ 底標
- [ ] 60級分對照符合邏輯：15級分對應60，0級分對應0
- [ ] 六個科目資料完整
- [ ] 日期已更新
- [ ] JSON格式正確（可用線上JSON驗證工具檢查）

### 驗證工具
```bash
# 檢查JSON格式
cd /Users/brianlu/Documents/UniHow/admission-frontend-web
node -e "console.log(JSON.parse(require('fs').readFileSync('JSON/configs/assessment_standards_113.json')))"
node -e "console.log(JSON.parse(require('fs').readFileSync('JSON/configs/score_conversion_113.json')))"
```

---

## 4️⃣ 資料匯入資料庫

完成所有資料收集後，執行以下步驟：

```bash
# 1. 連接到MongoDB
# 確保 .env.local 中有 MONGODB_URI2 設定

# 2. 建立 collections（如果尚未存在）
# 參考 PLACEMENT_ANALYSIS_PLANNING_V2.md 第3章的資料庫設計

# 3. 匯入五標資料
mongoimport --uri="你的MongoDB URI" \
  --collection=assessment_standards \
  --file=JSON/configs/assessment_standards_113.json

mongoimport --uri="你的MongoDB URI" \
  --collection=assessment_standards \
  --file=JSON/configs/assessment_standards_114.json

# 4. 匯入級分轉換表
mongoimport --uri="你的MongoDB URI" \
  --collection=score_conversions \
  --file=JSON/configs/score_conversion_113.json

mongoimport --uri="你的MongoDB URI" \
  --collection=score_conversions \
  --file=JSON/configs/score_conversion_114.json

# 5. 建立索引
mongo --eval "db.assessment_standards.createIndex({ academic_year: 1 }, { unique: true })"
mongo --eval "db.score_conversions.createIndex({ year: 1, exam_type: 1 }, { unique: true })"
```

---

## 5️⃣ 疑難排解

### Q: 找不到官方級分對照表
A: 可嘗試以下方法：
1. 聯繫大學考試入學分發委員會客服
2. 查閱該年度的「考生應考注意事項」PDF
3. 參考補習班網站（如TKB、一點通）的統計資料

### Q: 各科目的60級分轉換是否相同？
A: **不一定相同**。社會科和自然科因為原始分數滿分不同（144分、128分），轉換方式可能與其他科目（100分）不同。請務必分別查詢各科目的對照表。

### Q: 資料有誤怎麼辦？
A: 
1. 檢查原始來源（大考中心官網）
2. 比對多個來源的資料
3. 更新JSON檔案中的錯誤數值
4. 重新執行資料匯入

---

## 📞 聯絡資訊

- 大考中心：https://www.ceec.edu.tw/
- 考試分發委員會：https://www.uac.edu.tw/
- 客服電話：(02) 2364-3677

---

**最後更新**：2025-01-11
