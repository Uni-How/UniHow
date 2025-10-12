import Image from "next/image";

export default function Home() {
  return (
    <>
  {/* Top Navy Header */}
  <header className="navy-header">
    <div className="header-inner">
      <div className="logo">UniHow</div>

      <div className="header-right">
        <button className="icon-btn" aria-label="搜尋">
          <span className="icon magnifier" aria-hidden="true"></span>
        </button>
        <button className="icon-btn" aria-label="選單">
          <span className="icon menu" aria-hidden="true"></span>
        </button>
        <button className="cta-search">搜尋</button>
      </div>
    </div>
  </header>

  {/* Segmented Filters Bar */}
  <section className="segbar-wrap">
    <div className="segbar">
      <div className="seg seg-active seg-left">
        <div className="seg-label">入學方式</div>
        <div className="seg-value">申請</div>
      </div>
      <div className="seg">
        <div className="seg-label">學測成績</div>
        <div className="seg-value compact">國:--　英:--　數A:--　數B:--　自:--　社:--</div>
      </div>
      <div className="seg">
        <div className="seg-label">英聽成績</div>
        <div className="seg-value">A</div>
      </div>
      <div className="seg">
        <div className="seg-label">學群偏好</div>
        <div className="seg-value">二類</div>
      </div>
      <div className="seg seg-right">
        <div className="seg-label">公/私立</div>
        <div className="seg-value">公立</div>
      </div>
    </div>
  </section>

  {/* Action Chips Row */}
  <section className="actions-row">
    <div className="tabs">
      <button className="tab active">選校</button>
      <button className="tab">選系</button>
    </div>
    <div className="actions">
      <button className="chip">匯出表格</button>
      <button className="chip">儲存搜尋結果</button>
      <button className="chip">排序方式: 過篩機率</button>
      <button className="chip ghost">進階搜尋</button>
    </div>
  </section>

  {/* Main Two-Column Content */}
  <main className="content twocol">
    {/* Left Sidebar Filters */}
    <aside className="sidebar">
      <div className="muted-row">
        <span>無法入學校系：</span>
        <a href="#">隱藏</a>
      </div>

      <div className="filter-group">
        <button className="filter-title" aria-expanded="true">
          <span>地區：</span>
          <span className="caret"></span>
        </button>
        <div className="checklist">
          <label><input type="checkbox" /> 北北基</label>
          <label><input type="checkbox" /> 桃竹苗</label>
          <label><input type="checkbox" /> 宜花東</label>
          <label><input type="checkbox" /> 中彰投</label>
          <label><input type="checkbox" /> 雲嘉南</label>
          <label><input type="checkbox" /> 高屏金</label>
        </div>
      </div>

      <hr className="sep" />

      <div className="filter-group">
        <button className="filter-title" aria-expanded="true">
          <span>學群：</span>
          <span className="caret"></span>
        </button>
        <div className="checklist long">
          <label><input type="checkbox" /> 資訊</label>
          <label><input type="checkbox" /> 工程</label>
          <label><input type="checkbox" /> 數理化</label>
          <label><input type="checkbox" /> 醫藥衛生</label>
          <label><input type="checkbox" /> 生命科學</label>
          <label><input type="checkbox" /> 生物資源</label>
          <label><input type="checkbox" /> 地球環境</label>
          <label><input type="checkbox" /> 建築設計</label>
        </div>
      </div>
    </aside>

    {/* Left: Result List */}
    <section className="results">
      {/* Card 1 */}
      <article className="card horiz">
        <div className="thumb">
          <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop" alt="校園照片" />
        </div>
        <div className="card-body">
          <div className="card-top">
            <h3>國立臺灣大學</h3>
            <div className="kv small">可填科系數 <strong>5</strong></div>
          </div>
          <div className="sub">台北市大安區</div>
          <div className="tags">
            <span className="tag blue">資訊</span>
            <span className="tag lime">生命科學</span>
            <span className="tag mint">建築設計</span>
            <span className="tag pink">醫藥衛生</span>
          </div>
          <a className="more" href="#">查看詳情 <span className="arr">›</span></a>
        </div>
      </article>

      {/* Card 2 */}
      <article className="card horiz">
        <div className="thumb">
          <img src="https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1200&auto=format&fit=crop" alt="校園照片" />
        </div>
        <div className="card-body">
          <div className="card-top">
            <h3>國立清華大學</h3>
            <div className="kv small">可填科系數 <strong>8</strong></div>
          </div>
          <div className="sub">新竹市東區</div>
          <div className="tags">
            <span className="tag blue">資訊</span>
            <span className="tag lime">生命科學</span>
            <span className="tag mint">建築設計</span>
            <span className="tag orange">電機</span>
          </div>
          <a className="more" href="#">查看詳情 <span className="arr">›</span></a>
        </div>
      </article>

      {/* Ad block like screenshot */}
      <div className="ad-block">廣告</div>

      {/* Card 3 */}
      <article className="card horiz">
        <div className="thumb">
          <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop" alt="校園照片" />
        </div>
        <div className="card-body">
          <div className="card-top">
            <h3>國立陽明交通大學</h3>
            <div className="kv small">可填科系數 <strong>4</strong></div>
          </div>
          <div className="sub">新竹市東區</div>
          <div className="tags">
            <span className="tag blue">資訊</span>
            <span className="tag mint">數學</span>
            <span className="tag lime">生命科學</span>
          </div>
          <a className="more" href="#">查看詳情 <span className="arr">›</span></a>
        </div>
      </article>

      {/* Card 4 */}
      <article className="card horiz">
        <div className="thumb">
          <img src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1200&auto=format&fit=crop" alt="校園照片" />
        </div>
        <div className="card-body">
          <div className="card-top">
            <h3>國立成功大學</h3>
            <div className="kv small">可填科系數 <strong>6</strong></div>
          </div>
          <div className="sub">台南市東區</div>
          <div className="tags">
            <span className="tag blue">工程</span>
            <span className="tag lime">生命科學</span>
            <span className="tag mint">建築設計</span>
          </div>
          <a className="more" href="#">查看詳情 <span className="arr">›</span></a>
        </div>
      </article>

      {/* Card 5 */}
      <article className="card horiz">
        <div className="thumb">
          <img src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1200&auto=format&fit=crop" alt="校園照片" />
        </div>
        <div className="card-body">
          <div className="card-top">
            <h3>國立中央大學</h3>
            <div className="kv small">可填科系數 <strong>5</strong></div>
          </div>
          <div className="sub">桃園市中壢區</div>
          <div className="tags">
            <span className="tag blue">地球環境</span>
            <span className="tag lime">資訊</span>
            <span className="tag pink">物理</span>
          </div>
          <a className="more" href="#">查看詳情 <span className="arr">›</span></a>
        </div>
      </article>

      {/* Card 6 */}
      <article className="card horiz">
        <div className="thumb">
          <img src="https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=1200&auto=format&fit=crop" alt="校園照片" />
        </div>
        <div className="card-body">
          <div className="card-top">
            <h3>國立政治大學</h3>
            <div className="kv small">可填科系數 <strong>7</strong></div>
          </div>
          <div className="sub">台北市文山區</div>
          <div className="tags">
            <span className="tag blue">社會</span>
            <span className="tag pink">經濟</span>
            <span className="tag lime">外交</span>
          </div>
          <a className="more" href="#">查看詳情 <span className="arr">›</span></a>
        </div>
      </article>

      {/* Card 7 */}
      <article className="card horiz">
        <div className="thumb">
          <img src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop" alt="校園照片" />
        </div>
        <div className="card-body">
          <div className="card-top">
            <h3>國立中山大學</h3>
            <div className="kv small">可填科系數 <strong>5</strong></div>
          </div>
          <div className="sub">高雄市鼓山區</div>
          <div className="tags">
            <span className="tag mint">海洋</span>
            <span className="tag blue">管理</span>
            <span className="tag lime">資訊</span>
          </div>
          <a className="more" href="#">查看詳情 <span className="arr">›</span></a>
        </div>
      </article>

      {/* Card 8 */}
      <article className="card horiz">
        <div className="thumb">
          <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop" alt="校園照片" />
        </div>
        <div className="card-body">
          <div className="card-top">
            <h3>國立中興大學</h3>
            <div className="kv small">可填科系數 <strong>6</strong></div>
          </div>
          <div className="sub">台中市南區</div>
          <div className="tags">
            <span className="tag lime">生物資源</span>
            <span className="tag blue">資訊</span>
            <span className="tag pink">管理</span>
          </div>
          <a className="more" href="#">查看詳情 <span className="arr">›</span></a>
        </div>
      </article>
    </section>

    {/* Right: Details Panel */}
    <aside className="detail">
      <div className="detail-top">
        <img className="rounded main-hero" src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop" alt="校園主圖" />
        <img className="rounded thumb-sm" src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop" alt="校園縮圖" />
        <div className="map-card">
          <div className="map-pattern" aria-hidden="true"></div>
          <button className="map-btn">
            <span>查看地圖</span>
            <span className="map-icon" aria-hidden="true"></span>
          </button>
        </div>
      </div>

      <h2 className="uni-title">國立臺灣大學</h2>
      <div className="meta-links">
        <a href="#">校務資訊</a>
        <span className="dot"></span>
        <a href="#">傳送</a>
      </div>

      <div className="pill-tabs">
        <button className="pill active">科系列表</button>
        <button className="pill">校園資訊</button>
      </div>

      <div className="detail-bottom">
        <div className="department-list">
          <div>農業化學系</div>
          <div>資訊工程學系</div>
          <div>生命科學系</div>
          <div>建築學系</div>
          <div>醫學系</div>
          <div>化學系</div>
          <div>物理系</div>
          <div>數學系</div>
          <div>地質科學系</div>
          <div>心理學系</div>
          <div>經濟學系</div>
          <div>政治學系</div>
          <div>社會學系</div>
        </div>

        <div className="detailed-information">
          <div className="selection-order">
            <div className="so-table">
              <div className="so-head">去年(112)最低通過級分與篩選順序</div>
              <div className="so-body">
                <div className="so-row scores">
                  <div className="col">
                    <div className="label">國英數A自</div>
                    <div className="value">13</div>
                  </div>
                  <div className="arrow" aria-hidden="true">→</div>
                  <div className="col">
                    <div className="label">數學A</div>
                    <div className="value">10</div>
                  </div>
                  <div className="arrow" aria-hidden="true">→</div>
                  <div className="col">
                    <div className="label">自然</div>
                    <div className="value">13</div>
                  </div>
                </div>
                <hr className="divider" />
                <div className="so-row placeholder">
                  <div className="col"><div className="value muted">--</div></div>
                  <div className="arrow" aria-hidden="true">→</div>
                  <div className="col"><div className="value muted">--</div></div>
                  <div className="arrow" aria-hidden="true">→</div>
                  <div className="col"><div className="value muted">--</div></div>
                </div>
              </div>
            </div>
          </div>
          <div className="data-table">
            <div className="thead">
              <div>科目</div>
              <div>門檻</div>
              <div>倍率</div>
            </div>
            <div className="trow">
              <div>國文</div><div>均標</div><div>--</div>
            </div>
            <div className="trow">
              <div>英文</div><div>均標</div><div>--</div>
            </div>
            <div className="trow">
              <div>數學A</div><div>均標</div><div>5</div>
            </div>
            <div className="trow">
              <div>自然</div><div>均標</div><div>3</div>
            </div>
            <div className="trow">
              <div>國英數A自</div><div>—</div><div>—</div>
            </div>
          </div>
        </div>

      </div>
      

      <div className="foot-note">
        Collegeo ➜ <a href="#">查看全部</a>
      </div>

      <div className="small-note">
        去年(112)最低通過分與篩選順序
      </div>
    </aside>
  </main>
    </>
  );
}
