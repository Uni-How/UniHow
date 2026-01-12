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
          
          <div className="search-wrapper">
            {/* 核心搜尋組件：僅負責收集使用者條件並跳轉 */}
            <HeroSearch />
          </div>
        </div>
      </section>

      <style jsx>{`
        .hero-section {
          background: #0f172a;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .hero-content {
          width: 100%;
          max-width: 1000px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transform: translateY(-70px);
        }

        .hero-title {
          font-size: 2.5rem;
          color: white;
          font-weight: 700;
          margin-bottom: 42px;
        }

        @media (max-width: 640px) {
          .hero-content {
            transform: translateY(-40px);
          }

          .hero-title {
            margin-bottom: 36px;
          }
        }

        .search-wrapper {
          position: relative;
          width: 100%;
        }
      `}</style>
    </>
  );
}
