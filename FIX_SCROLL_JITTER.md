# 捲動太快導致界面跳動修復日誌

## 問題描述
當頁面捲動太快到達還沒載入的部分時，介面會上下跳動，搜尋欄會閃爍。

## 根本原因
1. **無限滾軸加載時的骨架屏抖動**
   - 顯示多個 SchoolCardSkeleton 會改變列表高度
   - 觀察目標 (observerTarget) 位置改變，觸發新的加載

2. **刷新覆蓋層的位置問題**
   - refresh-overlay 使用 absolute 定位導致所屬容器布局改變
   - 相對定位方式導致高度變化

3. **缺少性能優化**
   - 沒有使用 CSS containment 優化重排
   - will-change 未設置

## 修復方案

### 1. 無限滾軸加載指示器優化
**文件**: `app/results/page.tsx` (行 548-564)

**改動**: 
- 將多個骨架屏替換為固定高度的加載指示器 (88px)
- 加載指示器內包含 spinner 動畫和文字
- 防止高度變化導致觀察目標位置改變

```tsx
// 舊代碼：顯示骨架屏
{isFetching && schools.length > 0 && (
  <>
    <SchoolCardSkeleton />
    <SchoolCardSkeleton />
  </>
)}

// 新代碼：固定高度加載指示器
{isFetching && schools.length > 0 && (
  <div style={{ height: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {/* 動畫 spinner */}
  </div>
)}
```

### 2. 刷新覆蓋層位置調整
**文件**: `app/results/page.tsx` (行 520-528)

**改動**:
- 將 refresh-overlay 移出 space-y-4 容器
- 直接放在 left-panel 下方，相對於 left-panel 使用 absolute 定位
- 這樣不會影響 space-y-4 和內部子元素的高度

### 3. CSS 性能優化
**文件**: `app/results/results.css`

**改動**:
- 添加 `contain: paint` 到 left-panel，限制重排範圍
- 添加 `will-change: scroll-position` 提示瀏覽器優化
- 添加 `position: relative` 到 school-list 確保正確的層級關係

### 4. 觀察目標高度調整
**文件**: `app/results/page.tsx` (行 567)

**改動**:
- 從 `height: 1px` 改為 `height: 2px`
- 從無 margin 改為 `marginTop: 4px`
- 提高觀察準確度

## 效果驗證
- ✅ 快速滾動時界面不再跳動
- ✅ 搜尋欄不再閃爍
- ✅ 加載過程中保持視覺穩定
- ✅ 性能改善 (減少重排)

## 相關文件修改
1. `/app/results/page.tsx` - JSX 結構調整
2. `/app/results/results.css` - 樣式和性能優化
