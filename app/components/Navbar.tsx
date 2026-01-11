'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="navy-header">
      <div className="header-inner">
        <Link href="/" className="logo" style={{ fontFamily: "'BBH Hegarty', sans-serif", textDecoration: 'none', color: 'inherit' }}>UniHow</Link>
      </div>
    </header>
  );
}
