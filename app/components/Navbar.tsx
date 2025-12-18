'use client';

export default function Navbar() {
  return (
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
  );
}
