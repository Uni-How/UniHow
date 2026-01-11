#!/bin/bash

# 系統驗證測試腳本
# 用途: 快速驗證 API 端點和資料庫連接

set -e

API_URL="${1:-http://localhost:3000}"
ADMIN_KEY="${ADMIN_KEY:-}"

echo "🚀 UniHow 落點分析系統驗證"
echo "=================================="
echo "API URL: $API_URL"
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 計數器
PASSED=0
FAILED=0

# 測試函數
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5

  echo -n "測試: $name ... "

  if [ "$method" == "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_URL$endpoint")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" == "$expected_status" ] || [ -z "$expected_status" ]; then
    echo -e "${GREEN}✓ 通過${NC} (HTTP $http_code)"
    ((PASSED++))
  else
    echo -e "${RED}✗ 失敗${NC} (HTTP $http_code, 預期 $expected_status)"
    ((FAILED++))
  fi
}

# 1. 資料庫連接測試
echo -e "${BLUE}=== 1. 資料庫連接測試 ===${NC}"
test_endpoint "健康檢查" "GET" "/api/db-health" "" "200"

echo ""

# 2. 五標資料查詢
echo -e "${BLUE}=== 2. 五標資料查詢 ===${NC}"
test_endpoint "查詢 113 年學測五標" "GET" "/api/standards?year=113&type=gsat" "" "200"
test_endpoint "查詢 114 年分科五標" "GET" "/api/standards?year=114&type=bifurcated" "" "200"
test_endpoint "無效年份應返回 404" "GET" "/api/standards?year=999&type=gsat" "" "400"

echo ""

# 3. 級分轉換測試
echo -e "${BLUE}=== 3. 級分轉換測試 ===${NC}"
test_endpoint "轉換 113 年國文 13 級" "GET" "/api/score-conversion?year=113&subject=chinese&level=13" "" "200"
test_endpoint "轉換 114 年英文 15 級" "GET" "/api/score-conversion?year=114&subject=english&level=15" "" "200"
test_endpoint "無效科目應返回 400" "GET" "/api/score-conversion?year=113&subject=invalid&level=10" "" "400"

# 批量轉換測試
batch_conversion_data='{
  "academic_year": 113,
  "conversions": [
    {"subject": "chinese", "level_15": 13},
    {"subject": "english", "level_15": 12},
    {"subject": "math_a", "level_15": 14}
  ]
}'
test_endpoint "批量轉換級分" "POST" "/api/score-conversion" "$batch_conversion_data" "200"

echo ""

# 4. 科系統計查詢
echo -e "${BLUE}=== 4. 科系統計查詢 ===${NC}"
test_endpoint "查詢 113 年科系統計" "GET" "/api/departments-stats?year=113&limit=5" "" "200"

# 查詢學校列表
schools_data='{"action": "get_schools", "academic_year": 113}'
test_endpoint "查詢學校列表" "POST" "/api/departments-stats" "$schools_data" "200"

echo ""

# 5. 落點分析測試
echo -e "${BLUE}=== 5. 落點分析測試 ===${NC}"
analysis_data='{
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
test_endpoint "執行落點分析 (GSAT)" "POST" "/api/placement-analysis" "$analysis_data" "200"

bifurcated_data='{
  "academic_year": 113,
  "test_type": "bifurcated",
  "bifurcated_scores": {
    "math_a": 48,
    "chemistry": 45,
    "biology": 50
  }
}'
test_endpoint "執行落點分析 (分科)" "POST" "/api/placement-analysis" "$bifurcated_data" "200"

echo ""

# 6. 資料庫初始化測試 (如果提供了 ADMIN_KEY)
if [ ! -z "$ADMIN_KEY" ]; then
  echo -e "${BLUE}=== 6. 資料庫初始化測試 ===${NC}"
  
  seed_data='{
    "collections": ["assessment_standards_113", "assessment_standards_114"],
    "clear_first": false
  }'
  
  curl -s -X POST "$API_URL/api/db-seed" \
    -H "Content-Type: application/json" \
    -H "X-Admin-Key: $ADMIN_KEY" \
    -d "$seed_data" > /dev/null
  
  echo "✓ 資料庫初始化已發送"
else
  echo -e "${YELLOW}⊘ 跳過資料庫初始化測試 (未提供 ADMIN_KEY)${NC}"
fi

echo ""

# 結果總結
echo "=================================="
echo -e "${GREEN}✓ 通過: $PASSED${NC}"
echo -e "${RED}✗ 失敗: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 所有測試通過！${NC}"
  exit 0
else
  echo -e "${RED}❌ 部分測試失敗${NC}"
  exit 1
fi
