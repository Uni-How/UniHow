'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';

// 方法名稱對照表
const METHOD_LABELS: Record<string, string> = {
  'star_plan': '繁星',
  'personal_application': '申請',
  'distribution_admission': '分發'
};

const SUBJECT_LABELS: Record<string, string> = {
  'chinese': '國',
  'english': '英',
  'mathA': '數A',
  'mathB': '數B',
  'science': '自',
  'social': '社'
};

const REGIONS = ['北北基', '桃竹苗', '中彰投', '雲嘉南', '高屏', '宜花東', '離島'];

export default function CompactSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 從 URL 讀取當前搜尋條件
  const currentYear = searchParams.get('year') || '114';
  const currentMethod = searchParams.get('method') || 'personal_application';
  const currentGroups = (searchParams.get('group') || '').split(',').filter(Boolean);
  const currentRegions = (searchParams.get('region') || '').split(',').filter(Boolean);

  const [isExpanded, setIsExpanded] = useState(false);
  const [academicYear, setAcademicYear] = useState(currentYear);
  const [admissionMethod, setAdmissionMethod] = useState(currentMethod);
  const [scores, setScores] = useState({
    chinese: searchParams.get('chinese') || '',
    english: searchParams.get('english') || '',
    mathA: searchParams.get('mathA') || '',
    mathB: searchParams.get('mathB') || '',
    science: searchParams.get('science') || '',
    social: searchParams.get('social') || ''
  });
  const [listening, setListening] = useState(searchParams.get('listening') || '');
  const [publicPrivate, setPublicPrivate] = useState(searchParams.get('type') || '');
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set(currentGroups));
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set(currentRegions));
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [regionModalOpen, setRegionModalOpen] = useState(false);

  const groupButtonRef = useRef<HTMLButtonElement>(null);
  const regionButtonRef = useRef<HTMLButtonElement>(null);

  // Load academic groups
  useEffect(() => {
    async function loadMetadata() {
      try {
        const res = await fetch('/api/schools?limit=1');
        const data = await res.json();
        if (data.metadata?.academic_groups) {
          setAvailableGroups(data.metadata.academic_groups);
        }
      } catch (error) {
        console.error('Failed to load metadata:', error);
      }
    }
    loadMetadata();
  }, []);

  // Close modals on click outside
  useEffect(() => {
    if (!groupModalOpen && !regionModalOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if click is in group modal
      if (groupModalOpen && 
          !groupButtonRef.current?.contains(target) &&
          !target.closest('.multi-modal-wrapper')) {
        setGroupModalOpen(false);
      }

      // Check if click is in region modal
      if (regionModalOpen && 
          !regionButtonRef.current?.contains(target) &&
          !target.closest('.multi-modal-wrapper')) {
        setRegionModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [groupModalOpen, regionModalOpen]);

  const toggleGroupSelection = useCallback((group: string) => {
    setSelectedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  }, []);

  const toggleRegionSelection = useCallback((region: string) => {
    setSelectedRegions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(region)) {
        newSet.delete(region);
      } else {
        newSet.add(region);
      }
      return newSet;
    });
  }, []);

  const handleScoreChange = (subject: string, value: string) => {
    setScores(prev => ({ ...prev, [subject]: value }));
  };

  const handleYearChange = (year: string) => {
    setAcademicYear(year);
  };

  const getScoresDisplay = () => {
    return Object.entries(SUBJECT_LABELS)
      .map(([id, label]) => `${label}:${scores[id as keyof typeof scores] || '--'}`)
      .join(' ');
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set('year', academicYear);
    params.set('method', admissionMethod);

    Object.entries(scores).forEach(([subject, value]) => {
      if (value) params.set(subject, value);
    });

    if (listening) params.set('listening', listening);
    if (publicPrivate) params.set('type', publicPrivate);
    if (selectedGroups.size > 0) params.set('group', Array.from(selectedGroups).join(','));
    if (selectedRegions.size > 0) params.set('region', Array.from(selectedRegions).join(','));

    router.push(`/results?${params.toString()}`);
    setIsExpanded(false);
  };

  return (
    <div className="compact-search-wrapper">
      {/* Main Filter Bar */}
      <div className={`filter-bar ${isExpanded ? 'has-below' : ''}`}>
        {/* Academic Year */}
        <div className="filter-group year">
          <label>學年度</label>
          <div className="year-toggle">
            <button
              className={`year-btn ${academicYear === '114' ? 'active' : ''}`}
              onClick={() => handleYearChange('114')}
            >
              114
            </button>
            <button
              className={`year-btn ${academicYear === '115' ? 'active' : ''}`}
              onClick={() => handleYearChange('115')}
            >
              115
            </button>
          </div>
        </div>

        {/* Admission Method */}
        <div className="filter-group method">
          <label>入學方式</label>
          <select
            value={admissionMethod}
            onChange={(e) => setAdmissionMethod(e.target.value)}
            className="filter-select"
          >
            <option value="star_plan">繁星</option>
            <option value="personal_application">申請</option>
            <option value="distribution_admission">分發</option>
          </select>
        </div>

        {/* Scores Display - Click to expand */}
        <div
          className="filter-group scores-display"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: 'pointer' }}
        >
          <label>學測</label>
          <span className="filter-select scores-value">{getScoresDisplay()}</span>
        </div>

        {/* Other Filters Display */}
        <div className="filter-group">
          <label>英聽</label>
          <span className="filter-select">{listening || '--'}</span>
        </div>

        <div className="filter-group">
          <label>學群</label>
          <span className="filter-select">{selectedGroups.size > 0 ? `${selectedGroups.size}個` : '--'}</span>
        </div>

        <div className="filter-group">
          <label>地區</label>
          <span className="filter-select">{selectedRegions.size > 0 ? `${selectedRegions.size}個` : '--'}</span>
        </div>

        <div className="filter-group">
          <label>公/私立</label>
          <span className="filter-select">{publicPrivate || '--'}</span>
        </div>

        {/* Search Button */}
        <div className="filter-group search-group">
          <button className="search-btn" onClick={handleSearch}>
            搜尋
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isExpanded && (
        <div className="filter-bar-advanced">
          <div className="advanced-container">
            {/* Scores Section */}
            <div className="advanced-section">
              <h3>學測成績</h3>
              <div className="scores-grid">
                {Object.entries(SUBJECT_LABELS).map(([id, label]) => (
                  <div key={id} className="score-item">
                    <label>{label}</label>
                    <select
                      value={scores[id as keyof typeof scores]}
                      onChange={(e) => handleScoreChange(id, e.target.value)}
                      className="score-select"
                    >
                      <option value="">--</option>
                      {Array.from({ length: 15 }, (_, i) => 15 - i).map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Filters */}
            <div className="advanced-section">
              <div className="filters-grid">
                {/* Listening */}
                <div className="filter-group-compact">
                  <label>英聽</label>
                  <select
                    value={listening}
                    onChange={(e) => setListening(e.target.value)}
                    className="filter-select-compact"
                  >
                    <option value="">不篩選</option>
                    <option value="A">A級</option>
                    <option value="B">B級</option>
                    <option value="C">C級</option>
                    <option value="F">F級</option>
                  </select>
                </div>

                {/* Public/Private */}
                <div className="filter-group-compact">
                  <label>公/私立</label>
                  <select
                    value={publicPrivate}
                    onChange={(e) => setPublicPrivate(e.target.value)}
                    className="filter-select-compact"
                  >
                    <option value="">全部</option>
                    <option value="公立">公立</option>
                    <option value="私立">私立</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Groups - Multi-select */}
            <div className="advanced-section">
              <label className="section-label">學群</label>
              <button
                ref={groupButtonRef}
                className="multi-select-trigger"
                onClick={() => setGroupModalOpen(!groupModalOpen)}
              >
                {selectedGroups.size > 0 ? `已選 ${selectedGroups.size} 個` : '點擊選擇'}
                <span className="arrow">▼</span>
              </button>

              {groupModalOpen &&
                createPortal(
                  <div className="multi-modal-wrapper" onClick={(e) => e.stopPropagation()}>
                    <div className="multi-modal" style={{
                      position: 'fixed',
                      top: groupButtonRef.current?.getBoundingClientRect().bottom || 0,
                      left: groupButtonRef.current?.getBoundingClientRect().left || 0,
                    }}>
                      <div className="multi-grid">
                        {availableGroups.map((group) => (
                          <label key={group} className="multi-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedGroups.has(group)}
                              onChange={() => toggleGroupSelection(group)}
                            />
                            {group}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
            </div>

            {/* Regions - Multi-select */}
            <div className="advanced-section">
              <label className="section-label">地區</label>
              <button
                ref={regionButtonRef}
                className="multi-select-trigger"
                onClick={() => setRegionModalOpen(!regionModalOpen)}
              >
                {selectedRegions.size > 0 ? `已選 ${selectedRegions.size} 個` : '點擊選擇'}
                <span className="arrow">▼</span>
              </button>

              {regionModalOpen &&
                createPortal(
                  <div className="multi-modal-wrapper" onClick={(e) => e.stopPropagation()}>
                    <div className="multi-modal" style={{
                      position: 'fixed',
                      top: regionButtonRef.current?.getBoundingClientRect().bottom || 0,
                      left: regionButtonRef.current?.getBoundingClientRect().left || 0,
                    }}>
                      <div className="multi-grid">
                        {REGIONS.map((region) => (
                          <label key={region} className="multi-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedRegions.has(region)}
                              onChange={() => toggleRegionSelection(region)}
                            />
                            {region}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
            </div>

            {/* Action Buttons */}
            <div className="advanced-actions">
              <button className="btn-reset" onClick={() => {
                setAcademicYear('114');
                setAdmissionMethod('personal_application');
                setScores({
                  chinese: '',
                  english: '',
                  mathA: '',
                  mathB: '',
                  science: '',
                  social: ''
                });
                setListening('');
                setPublicPrivate('');
                setSelectedGroups(new Set());
                setSelectedRegions(new Set());
              }}>
                清除篩選
              </button>
              <button className="btn-search" onClick={handleSearch}>
                搜尋
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .compact-search-wrapper {
          width: 100%;
          position: relative;
        }

        /* Filter Bar */
        .filter-bar {
          display: flex;
          align-items: stretch;
          background: white;
          border: 2px solid #0F5AA8;
          border-radius: 30px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(11,34,64,0.08);
          transition: all 0.3s ease;
        }

        .filter-bar.has-below {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          border-bottom: none;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 12px 16px;
          border-right: 1px solid #e5e5e5;
          min-width: fit-content;
          align-items: flex-start;
        }

        .filter-group:last-child {
          border-right: none;
        }

        .filter-group label {
          font-size: 0.65rem;
          color: #999;
          text-transform: uppercase;
          margin-bottom: 4px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .filter-select {
          background: none;
          border: none;
          padding: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #333;
          outline: none;
          cursor: pointer;
          font-family: inherit;
        }

        .scores-display {
          cursor: pointer;
          flex: 1;
          min-width: 280px;
        }

        .scores-value {
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.5px;
          color: #333;
        }

        /* Year Toggle */
        .year-toggle {
          display: flex;
          background: #f0f0f0;
          border-radius: 6px;
          padding: 2px;
          gap: 2px;
          width: fit-content;
        }

        .year-btn {
          border: none;
          background: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
        }

        .year-btn.active {
          background: #0F5AA8;
          color: white;
        }

        .search-group {
          border: none;
          padding-right: 8px;
        }

        .search-btn {
          background: #0F5AA8;
          color: white;
          border: none;
          border-radius: 20px;
          padding: 8px 24px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .search-btn:hover {
          background: #0d4a8a;
        }

        /* Advanced Panel */
        .filter-bar-advanced {
          background: white;
          border: 2px solid #0F5AA8;
          border-top: none;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          box-shadow: 0 4px 12px rgba(11,34,64,0.1);
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .advanced-container {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .advanced-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .advanced-section h3 {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
        }

        .section-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
        }

        /* Scores Grid */
        .scores-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .score-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .score-item label {
          font-size: 0.8rem;
          color: #666;
          font-weight: 500;
        }

        .score-select {
          padding: 6px 8px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.85rem;
          outline: none;
          cursor: pointer;
        }

        .score-select:focus {
          border-color: #0F5AA8;
        }

        /* Filters Grid */
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .filter-group-compact {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-group-compact label {
          font-size: 0.8rem;
          color: #666;
          font-weight: 500;
        }

        .filter-select-compact {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.9rem;
          outline: none;
          cursor: pointer;
        }

        .filter-select-compact:focus {
          border-color: #0F5AA8;
        }

        /* Multi-select */
        .multi-select-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .multi-select-trigger:hover {
          border-color: #0F5AA8;
          background: #f8f9fa;
        }

        .arrow {
          margin-left: 8px;
          font-size: 0.7rem;
        }

        .multi-modal-wrapper {
          z-index: 9999;
        }

        .multi-modal {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 12px;
          min-width: 300px;
          max-height: 300px;
          overflow-y: auto;
        }

        .multi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .multi-checkbox {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s;
          font-size: 0.9rem;
        }

        .multi-checkbox:hover {
          background: #f0f0f0;
        }

        .multi-checkbox input {
          cursor: pointer;
          width: 16px;
          height: 16px;
          accent-color: #0F5AA8;
        }

        /* Actions */
        .advanced-actions {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #e5e5e5;
        }

        .btn-reset {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          font-size: 0.9rem;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-reset:hover {
          border-color: #0F5AA8;
          color: #0F5AA8;
        }

        .btn-search {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 6px;
          background: #0F5AA8;
          color: white;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-search:hover {
          background: #0d4a8a;
        }
      `}</style>
    </div>
  );
}
