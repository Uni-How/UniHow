'use client';

import Navbar from './components/Navbar';
import HeroSearch from './components/HeroSearch';

// --- Homepage (首頁 / Landing Page) ---
// 此頁面設計為靜態入口，專注於「引導使用者搜尋」，不直接顯示結果。
// 這樣的設計可以讓首頁載入更快，並將複雜的資料邏輯隔離在 /results 頁面。

export default function Home() {
  return (
    <>
      <Navbar />
      
      {/* Hero Section (主視覺與搜尋區) */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">找學校，跟找飯店一樣簡單！</h1>
          <p className="hero-subtitle">TESTINGGGGGGGGGGGGGG</p>
          
          <div className="search-wrapper">
            {/* 核心搜尋組件：僅負責收集使用者條件並跳轉 */}
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* Info Cards Section (資訊卡片 - 靜態導引) */}
      <section className="info-cards-section">
        <div className="cards-container">
          <div className="info-card">
            <div className="card-btn-area">
              <button className="card-btn">查看招生簡章 ➜</button>
            </div>
          </div>
          <div className="info-card">
             <div className="card-btn-area">
              <button className="card-btn">查看歷屆資料 ➜</button>
            </div>
          </div>
          <div className="info-card">
             <div className="card-btn-area">
              <button className="card-btn">查看重要時程 ➜</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Ad Space */}
      <section className="ad-section">
        <div className="ad-box">
          <h2>廣 告</h2>
        </div>
      </section>

      <style jsx>{`
        /* ========================================= */
        /*   🎨 CSS 樣式教學區 (Style Guide)          */
        /*   修改這裡的數值可以改變網頁的外觀          */
        /* ========================================= */

        .hero-section {
          background: #0f172a; /* 背景顏色 (色碼或顏色名稱) */
          padding: 80px 20px 120px; /* 內距：上 左右 下 */
          text-align: left;
          display: flex;
          justify-content: center;
        }

        .hero-content {
          width: 100%;
          max-width: 1000px; /* 最大寬度，限制內容不擴散太寬 */
        }

        .hero-title {
          font-size: 2.5rem; /* 字體大小 (2.5倍根元素大小) */
          color: white;      /* 文字顏色 */
          font-weight: 700;  /* 字體粗細 (400=正常, 700=粗體) */
          margin-bottom: 10px; /* 下方間距 */
        }

        .hero-subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7); /* 半透明白色 */
          margin-bottom: 40px;
        }

        .search-wrapper {
          position: relative;
          z-index: 10;
        }

        .info-cards-section {
          background: white;
          padding: 0 20px;
          margin-top: -60px; /* 負邊距：讓區塊向上重疊 */
          display: flex;
          justify-content: center;
          position: relative;
          z-index: 20;
        }

        .cards-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr); /* 建立三欄 */
          gap: 20px; /* 格子間距 */
          width: 100%;
          max-width: 1000px;
        }

        .info-card {
          background: #e5e7eb;
          height: 200px;     /* 卡片高度 */
          border-radius: 20px; /* 圓角程度 */
          position: relative;
          display: flex;
          align-items: flex-end; /* 內容對齊底部 */
          padding: 20px;
        }

        .card-btn {
          background: #0f172a;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        /* --- 廣告區塊樣式 (Ad Style) --- */
        .ad-section {
          background: white;
          padding: 60px 20px; /* 上下留白 */
          display: flex;
          justify-content: center;
        }

        .ad-box {
          background: #e5e7eb; /* 廣告背景灰 */
          width: 100%;
          max-width: 1000px;
          height: 200px;     /* 廣告高度 */
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;   /* 字太小改這裡 */
          font-weight: 900;
          color: black;      /* 字體顏色 */
        }

        /* 手機版響應式設定 */
        @media (max-width: 768px) {
          .cards-container {
            grid-template-columns: 1fr; /* 手機上改為單欄 */
          }
        }
      `}</style>
    </>
  );
}
