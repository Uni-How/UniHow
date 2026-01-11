'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';

// --- ResultsSearchBar Component (結果頁搜尋組件) ---
// 複製自 HeroSearch，用於結果頁面的搜尋欄
// 保持獨立以便後期可針對結果頁做特定調整

export default function ResultsSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 從 URL 初始化狀態
  const initYear = searchParams.get('year') || '115';
  const initMethod = searchParams.get('method') || 'distribution_admission';
  const initListening = searchParams.get('listening') || '';
  const initType = searchParams.get('type') || '';
  const initGroups = searchParams.get('group')?.split(',').filter(Boolean) || [];
  const initRegions = searchParams.get('region')?.split(',').filter(Boolean) || [];
  
  // States (表單狀態)
  const [academicYear, setAcademicYear] = useState(initYear);
  const [admissionMethod, setAdmissionMethod] = useState(initMethod);
  const [isMethodOpen, setIsMethodOpen] = useState(false);
  const [isListeningOpen, setIsListeningOpen] = useState(false);
  const [expandedScoreType, setExpandedScoreType] = useState<'gsat' | 'bifurcated' | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  // 成績輸入狀態
  const [scores, setScores] = useState({
    chinese: searchParams.get('chinese') || '',
    english: searchParams.get('english') || '',
    mathA: searchParams.get('mathA') || '',
    mathB: searchParams.get('mathB') || '',
    science: searchParams.get('science') || '',
    social: searchParams.get('social') || ''
  });
  const [listening, setListening] = useState(initListening);
  
  // 分科測驗成績
  const [bifurcatedScores, setBifurcatedScores] = useState({
    mathIA: searchParams.get('bifurcatedMathIA') || '',
    mathIB: searchParams.get('bifurcatedMathIB') || '',
    physics: searchParams.get('bifurcatedPhysics') || '',
    chemistry: searchParams.get('bifurcatedChemistry') || '',
    biology: searchParams.get('bifurcatedBiology') || '',
    history: searchParams.get('bifurcatedHistory') || '',
    geography: searchParams.get('bifurcatedGeography') || '',
    civics: searchParams.get('bifurcatedCivics') || ''
  });

  const handleYearChange = (year: string) => {
    setAcademicYear(year);
  };

  // Auto-select first subject when modal opens
  useEffect(() => {
    if (expandedScoreType === 'gsat') {
      setSelectedSubject('chinese');
    } else if (expandedScoreType === 'bifurcated') {
      setSelectedSubject('mathIA');
    }
  }, [expandedScoreType]);

  // Auto-focus input field when subject changes
  useEffect(() => {
    if (selectedSubject && expandedScoreType) {
      setTimeout(() => {
        scoreInputRef.current?.focus();
        scoreInputRef.current?.select();
      }, 0);
    }
  }, [selectedSubject, expandedScoreType]);

  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scoreInputRef = useRef<HTMLInputElement | null>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      const isInsideScoreModal = (target as HTMLElement).closest('.score-modal-wrapper') !== null;
      const isBackdrop = (target as HTMLElement).classList.contains('modal-backdrop');
      
      if (isInsideScoreModal) {
        return;
      }
      
      if (isBackdrop) {
        return;
      }
      
      const isInside = Object.values(dropdownRefs.current).some((ref) => ref && ref.contains(target));
      if (!isInside) {
        setIsMethodOpen(false);
        setIsListeningOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const LEVELS = Array.from({ length: 15 }, (_, i) => 15 - i);
  const BIFURCATED_LEVELS = Array.from({ length: 60 }, (_, i) => 60 - i);

  const handleScoreChange = (subject: string, value: string) => {
    setScores(prev => ({ ...prev, [subject]: value }));
  };

  const handleBifurcatedScoreChange = (subject: string, value: string) => {
    setBifurcatedScores(prev => ({ ...prev, [subject]: value }));
  };

  // Handle Search - 保留從 URL 帶入的進階篩選參數
  const handleSearch = () => {
    const params = new URLSearchParams();
    
    params.set('year', academicYear);
    params.set('method', admissionMethod);
    if (scores.chinese) params.set('chinese', scores.chinese);
    if (scores.english) params.set('english', scores.english);
    if (scores.mathA) params.set('mathA', scores.mathA);
    if (scores.mathB) params.set('mathB', scores.mathB);
    if (scores.science) params.set('science', scores.science);
    if (scores.social) params.set('social', scores.social);
    
    if (listening) params.set('listening', listening);
    
    // 保留從 URL 讀取的進階篩選參數（由「進階篩選」面板控制）
    if (initGroups.length) params.set('group', initGroups.join(','));
    if (initType) params.set('type', initType);
    if (initRegions.length) params.set('region', initRegions.join(','));

    if (bifurcatedScores.mathIA) params.set('bifurcatedMathIA', bifurcatedScores.mathIA);
    if (bifurcatedScores.mathIB) params.set('bifurcatedMathIB', bifurcatedScores.mathIB);
    if (bifurcatedScores.physics) params.set('bifurcatedPhysics', bifurcatedScores.physics);
    if (bifurcatedScores.chemistry) params.set('bifurcatedChemistry', bifurcatedScores.chemistry);
    if (bifurcatedScores.biology) params.set('bifurcatedBiology', bifurcatedScores.biology);
    if (bifurcatedScores.history) params.set('bifurcatedHistory', bifurcatedScores.history);
    if (bifurcatedScores.geography) params.set('bifurcatedGeography', bifurcatedScores.geography);
    if (bifurcatedScores.civics) params.set('bifurcatedCivics', bifurcatedScores.civics);

    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="results-search-container">
      {/* Main Filter Bar */}
      <div className="filter-bar">
        {/* Academic Year */}
        <div className="filter-group year">
          <label>學年度</label>
          <div className="year-toggle">
             <button 
               className={`year-btn ${academicYear === '115' ? 'active' : ''}`}
               onClick={() => handleYearChange('115')}
             >
               115
             </button>
             <button 
               className={`year-btn ${academicYear === '114' ? 'active' : ''}`}
               onClick={() => handleYearChange('114')}
             >
               114
             </button>
          </div>
        </div>

        {/* Admission Method */}
        <div
          className="filter-group method"
          ref={(node) => { dropdownRefs.current.method = node; }}
        >
          <label>入學方式</label>
          <div className="custom-dropdown">
            <button
              type="button"
              className="dropdown-toggle"
              onClick={() => {
                setIsMethodOpen((prev) => !prev);
                setIsListeningOpen(false);
              }}
            >
              {admissionMethod === 'distribution_admission' ? '分發入學' : 
               admissionMethod === 'personal_application' ? '個人申請' : 
               admissionMethod === 'star_plan' ? '繁星推薦' : '請選擇'}
              <span className="dropdown-caret">▾</span>
            </button>
            {isMethodOpen && (
              <div className="dropdown-menu">
                {[{
                  value: 'distribution_admission',
                  label: '分發入學',
                  disabled: false,
                  note: ''
                }, {
                  value: 'personal_application',
                  label: '個人申請',
                  disabled: true,
                  note: '功能尚未推出'
                }, {
                  value: 'star_plan',
                  label: '繁星推薦',
                  disabled: true,
                  note: '功能尚未推出'
                }].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`dropdown-item ${option.disabled ? 'disabled' : ''}`}
                    disabled={option.disabled}
                    onClick={() => {
                      if (!option.disabled) {
                        setAdmissionMethod(option.value);
                        setIsMethodOpen(false);
                      }
                    }}
                  >
                    <div className="item-row">
                      <span>{option.label}</span>
                      {option.disabled && <small>{option.note}</small>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scores Display */}
        <div className="filter-group scores-display">
          <label>成績</label>
          <div className="scores-text-container">
            <div 
              className="scores-text-line gsat-line"
              onClick={() => setExpandedScoreType(expandedScoreType === 'gsat' ? null : 'gsat')}
            >
              <span className="scores-title">學測:</span>
              <span className="scores-value">
                國:{scores.chinese || '--'} 英:{scores.english || '--'} 數A:{scores.mathA || '--'} 數B:{scores.mathB || '--'} 自:{scores.science || '--'} 社:{scores.social || '--'}
              </span>
            </div>
            <div 
              className="scores-text-line bifurcated-line"
              onClick={() => setExpandedScoreType(expandedScoreType === 'bifurcated' ? null : 'bifurcated')}
            >
              <span className="scores-title">分科:</span>
              <span className="scores-value">
                數甲:{bifurcatedScores.mathIA || '--'} 數乙:{bifurcatedScores.mathIB || '--'} 物:{bifurcatedScores.physics || '--'} 化:{bifurcatedScores.chemistry || '--'} 生:{bifurcatedScores.biology || '--'} 歷:{bifurcatedScores.history || '--'} 地:{bifurcatedScores.geography || '--'} 公:{bifurcatedScores.civics || '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Listening */}
        <div
          className="filter-group listening"
          ref={(node) => { dropdownRefs.current.listening = node; }}
        >
          <label>英聽</label>
          <div className="custom-dropdown">
            <button
              type="button"
              className="dropdown-toggle"
              onClick={() => {
                setIsListeningOpen((prev) => !prev);
                setIsMethodOpen(false);
              }}
            >
              {listening || '無'}
              <span className="dropdown-caret">▾</span>
            </button>
            {isListeningOpen && (
              <div className="dropdown-menu">
                {[{ value: '', label: '無（不篩選）' }, { value: 'A', label: 'A級' }, { value: 'B', label: 'B級' }, { value: 'C', label: 'C級' }, { value: 'F', label: 'F級' }].map((option) => (
                  <button
                    key={option.value || 'none'}
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setListening(option.value);
                      setIsListeningOpen(false);
                    }}
                  >
                    <div className="item-row">
                      <span>{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Button */}
        <button className="search-btn" onClick={handleSearch}>
          搜尋
        </button>
      </div>

      {/* Score Input Modal */}
      {expandedScoreType && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className="modal-backdrop"
            onClick={() => {
              setExpandedScoreType(null);
              setSelectedSubject(null);
              setFocusedInput(null);
            }}
          />
          
          <div className="score-modal-wrapper">
            <div className="score-modal">
              <div className="modal-header">
                <h3>
                  {expandedScoreType === 'gsat' ? '學測成績' : '分科測驗成績'}
                </h3>
                <button 
                  className="modal-confirm-inline"
                  onClick={() => {
                    setExpandedScoreType(null);
                    setSelectedSubject(null);
                    setFocusedInput(null);
                  }}
                >
                  確認
                </button>
              </div>

              <div className="modal-body">
              {expandedScoreType === 'gsat' && (
                <div className="subjects-grid">
                  {[
                    { id: 'chinese', label: '國' },
                    { id: 'english', label: '英' },
                    { id: 'mathA', label: '數A' },
                    { id: 'mathB', label: '數B' },
                    { id: 'science', label: '自' },
                    { id: 'social', label: '社' }
                  ].map((subject) => (
                    <div 
                      key={subject.id}
                      className={`subject-card ${selectedSubject === subject.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSubject(subject.id)}
                    >
                      {subject.label}：{scores[subject.id as keyof typeof scores] || '--'}
                    </div>
                  ))}
                </div>
              )}

              {expandedScoreType === 'bifurcated' && (
                <div className="subjects-grid">
                  {[
                    { id: 'mathIA', label: '數甲' },
                    { id: 'mathIB', label: '數乙' },
                    { id: 'physics', label: '物理' },
                    { id: 'chemistry', label: '化學' },
                    { id: 'biology', label: '生物' },
                    { id: 'history', label: '歷史' },
                    { id: 'geography', label: '地理' },
                    { id: 'civics', label: '公民' }
                  ].map((subject) => (
                    <div 
                      key={subject.id}
                      className={`subject-card ${selectedSubject === subject.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSubject(subject.id)}
                    >
                      {subject.label}：{bifurcatedScores[subject.id as keyof typeof bifurcatedScores] || '--'}
                    </div>
                  ))}
                </div>
              )}

              {selectedSubject && (
                <div className="input-editor">
                  {expandedScoreType === 'gsat' && (() => {
                    const subjects = [
                      { id: 'chinese', label: '國' },
                      { id: 'english', label: '英' },
                      { id: 'mathA', label: '數A' },
                      { id: 'mathB', label: '數B' },
                      { id: 'science', label: '自' },
                      { id: 'social', label: '社' }
                    ];
                    const currentSubject = subjects.find(s => s.id === selectedSubject);
                    return currentSubject ? (
                      <>
                        <div className="editor-header">
                          編輯 {currentSubject.label}
                        </div>
                        <div className="input-group">
                          <input
                            ref={scoreInputRef}
                            type="text"
                            className="score-input-field"
                            value={scores[selectedSubject as keyof typeof scores] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d+$/.test(val)) {
                                const num = val ? parseInt(val) : '';
                                if (num === '' || (num >= 1 && num <= 15)) {
                                  handleScoreChange(selectedSubject, String(num));
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && scores[selectedSubject as keyof typeof scores]) {
                                const subjects = ['chinese', 'english', 'mathA', 'mathB', 'science', 'social'];
                                const currentIndex = subjects.indexOf(selectedSubject);
                                for (let i = currentIndex + 1; i < subjects.length; i++) {
                                  if (!scores[subjects[i] as keyof typeof scores]) {
                                    setSelectedSubject(subjects[i]);
                                    return;
                                  }
                                }
                                for (let i = 0; i < currentIndex; i++) {
                                  if (!scores[subjects[i] as keyof typeof scores]) {
                                    setSelectedSubject(subjects[i]);
                                    return;
                                  }
                                }
                              }
                            }}
                            placeholder="輸入級分"
                            autoFocus
                          />
                          <button 
                            className="score-clear-btn"
                            onClick={() => handleScoreChange(selectedSubject, '')}
                          >
                            清空
                          </button>
                        </div>

                        <div className="button-grid">
                          {LEVELS.map(level => (
                            <button
                              key={level}
                              className={`score-btn-horizontal ${scores[selectedSubject as keyof typeof scores] === String(level) ? 'active' : ''}`}
                              onClick={() => {
                                handleScoreChange(selectedSubject, String(level));
                                const subjects = ['chinese', 'english', 'mathA', 'mathB', 'science', 'social'];
                                const currentIndex = subjects.indexOf(selectedSubject);
                                for (let i = currentIndex + 1; i < subjects.length; i++) {
                                  if (!scores[subjects[i] as keyof typeof scores]) {
                                    setTimeout(() => setSelectedSubject(subjects[i]), 50);
                                    return;
                                  }
                                }
                                for (let i = 0; i < currentIndex; i++) {
                                  if (!scores[subjects[i] as keyof typeof scores]) {
                                    setTimeout(() => setSelectedSubject(subjects[i]), 50);
                                    return;
                                  }
                                }
                              }}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : null;
                  })()}

                  {expandedScoreType === 'bifurcated' && (() => {
                    const subjects = [
                      { id: 'mathIA', label: '數甲' },
                      { id: 'mathIB', label: '數乙' },
                      { id: 'physics', label: '物理' },
                      { id: 'chemistry', label: '化學' },
                      { id: 'biology', label: '生物' },
                      { id: 'history', label: '歷史' },
                      { id: 'geography', label: '地理' },
                      { id: 'civics', label: '公民' }
                    ];
                    const currentSubject = subjects.find(s => s.id === selectedSubject);
                    return currentSubject ? (
                      <>
                        <div className="editor-header">
                          編輯 {currentSubject.label}
                        </div>
                        <div className="input-group">
                          <input
                            ref={scoreInputRef}
                            type="text"
                            className="score-input-field"
                            value={bifurcatedScores[selectedSubject as keyof typeof bifurcatedScores] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d+$/.test(val)) {
                                const num = val ? parseInt(val) : '';
                                if (num === '' || (num >= 1 && num <= 60)) {
                                  handleBifurcatedScoreChange(selectedSubject, String(num));
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && bifurcatedScores[selectedSubject as keyof typeof bifurcatedScores]) {
                                const subjects = ['mathIA', 'mathIB', 'physics', 'chemistry', 'biology', 'history', 'geography', 'civics'];
                                const currentIndex = subjects.indexOf(selectedSubject);
                                for (let i = currentIndex + 1; i < subjects.length; i++) {
                                  if (!bifurcatedScores[subjects[i] as keyof typeof bifurcatedScores]) {
                                    setSelectedSubject(subjects[i]);
                                    return;
                                  }
                                }
                                for (let i = 0; i < currentIndex; i++) {
                                  if (!bifurcatedScores[subjects[i] as keyof typeof bifurcatedScores]) {
                                    setSelectedSubject(subjects[i]);
                                    return;
                                  }
                                }
                              }
                            }}
                            placeholder="輸入級分"
                            autoFocus
                          />
                          <button 
                            className="score-clear-btn"
                            onClick={() => handleBifurcatedScoreChange(selectedSubject, '')}
                          >
                            清空
                          </button>
                        </div>

                        <div className="button-grid bifurcated-grid">
                          {BIFURCATED_LEVELS.map(level => (
                            <button
                              key={level}
                              className={`score-btn-horizontal ${bifurcatedScores[selectedSubject as keyof typeof bifurcatedScores] === String(level) ? 'active' : ''}`}
                              onClick={() => {
                                handleBifurcatedScoreChange(selectedSubject, String(level));
                                const subjects = ['mathIA', 'mathIB', 'physics', 'chemistry', 'biology', 'history', 'geography', 'civics'];
                                const currentIndex = subjects.indexOf(selectedSubject);
                                for (let i = currentIndex + 1; i < subjects.length; i++) {
                                  if (!bifurcatedScores[subjects[i] as keyof typeof bifurcatedScores]) {
                                    setTimeout(() => setSelectedSubject(subjects[i]), 50);
                                    return;
                                  }
                                }
                                for (let i = 0; i < currentIndex; i++) {
                                  if (!bifurcatedScores[subjects[i] as keyof typeof bifurcatedScores]) {
                                    setTimeout(() => setSelectedSubject(subjects[i]), 50);
                                    return;
                                  }
                                }
                              }}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              )}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      <style jsx>{`
        .results-search-container {
          width: 100%;
          font-family: Inter, "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft JhengHei", Arial, sans-serif;
          position: relative;
        }

        .filter-bar {
          background: white;
          border-radius: 16px;
          padding: 10px 8px;
          display: flex;
          align-items: stretch;
          gap: 0;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          overflow: visible;
          border: 1px solid #e1e1e1;
          position: relative;
          transition: border-radius 0.3s ease;
        }

        .filter-group {
          padding: 6px 12px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-right: 1px solid #eee;
          min-width: 70px;
        }

        .filter-group:last-of-type {
          border-right: none;
        }

        .filter-group label {
          font-size: 0.65rem;
          color: #888;
          margin-bottom: 2px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .method {
           background: #fae8b4;
           border-radius: 12px 0 0 12px;
           margin: -10px 0 -10px -8px;
           padding: 8px 14px;
        }

        .filter-bar.has-below .method {
          border-radius: 12px 0 0 0;
        }

        .listening {
          min-width: 50px !important;
          padding: 6px 8px !important;
        }

        .listening label {
          font-size: 0.6rem !important;
        }

        .listening .dropdown-toggle {
          font-size: 0.85rem !important;
        }

        .custom-dropdown {
          position: relative;
        }

        .dropdown-toggle {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: transparent;
          border: none;
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
          cursor: pointer;
          padding: 0;
        }

        .dropdown-caret {
          font-size: 0.7rem;
          color: #666;
          margin-left: 6px;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 160px;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          z-index: 1000;
          overflow: hidden;
        }

        .dropdown-item {
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          background: white;
          border: none;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .dropdown-item:hover:not(.disabled) {
          background: #f5f5f5;
        }

        .dropdown-item.disabled {
          color: #9ca3af;
          cursor: not-allowed;
          background: #f8f8f8;
        }

        .dropdown-item small {
          display: block;
          font-size: 0.65rem;
          color: #9ca3af;
          margin-top: 2px;
        }

        .item-row {
          display: flex;
          flex-direction: column;
        }

        /* Scores Display Styles */
        .scores-display {
          flex: 1.2;
          padding: 0 12px !important;
          border-right: 1px solid #eee !important;
          min-width: 240px;
        }

        .scores-text-container {
          display: flex;
          flex-direction: column;
          gap: 1px;
          align-items: flex-start;
        }

        .scores-text-line {
          display: flex;
          align-items: center;
          flex-wrap: nowrap;
          gap: 8px;
          font-size: 0.8rem;
          color: #333;
          line-height: 1.3;
          min-width: 0;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .scores-text-line:hover {
          background: #f5f5f5;
        }

        .scores-title {
          font-weight: 700;
          font-size: 0.8rem;
          color: #333;
          white-space: nowrap;
        }

        .scores-value {
          font-size: 0.8rem;
          color: #666;
          font-family: Inter, "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft JhengHei", Arial, sans-serif;
        }

        /* Search Button */
        .search-btn {
          background: #0f172a;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0 18px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          margin-left: 6px;
          white-space: nowrap;
          transition: background 0.2s;
        }

        .search-btn:hover {
          background: #1e293b;
        }

        /* Year Toggle */
        .year-toggle {
          display: flex;
          background: #f0f0f0;
          border-radius: 6px;
          padding: 2px;
          gap: 2px;
        }

        .year-btn {
          border: none;
          background: none;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
        }

        .year-btn.active {
          background: white;
          color: #0f172a;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        /* Modal Styles */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1000;
          backdrop-filter: blur(2px);
        }

        .score-modal-wrapper {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1001;
          display: inline-block;
        }

        .score-modal {
          position: relative;
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 600px;
          width: 90vw;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid #e1e1e1;
          position: relative;
        }

        .modal-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        .modal-confirm-inline {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: #1e40af;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }

        .modal-confirm-inline:hover {
          background: #1e3a8a;
          box-shadow: 0 6px 14px rgba(30, 64, 175, 0.3);
        }

        .modal-confirm-inline:active {
          transform: translateY(-50%) scale(0.98);
        }

        .modal-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .subjects-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
        }

        .subject-card {
          background: white;
          border: 2px solid #ddd;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: right;
          font-weight: 600;
          font-size: 0.95rem;
          white-space: nowrap;
        }

        .subject-card:hover {
          border-color: #1e40af;
          background: #f0f7ff;
        }

        .subject-card.selected {
          background: #1e40af;
          border-color: #1e40af;
          color: white;
        }

        .input-editor {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e1e1e1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .editor-header {
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
        }

        .input-group {
          display: flex;
          gap: 8px;
        }

        .score-input-field {
          border: 2px solid #ddd;
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 1rem;
          font-weight: 500;
          color: #333;
          transition: border-color 0.2s;
          flex: 1;
        }

        .score-input-field:focus {
          outline: none;
          border-color: #1e40af;
          box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
        }

        .score-clear-btn {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 10px 16px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          color: #666;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .score-clear-btn:hover {
          background: #f5f5f5;
          border-color: #999;
        }

        .button-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }

        .button-grid.bifurcated-grid {
          grid-template-columns: repeat(6, 1fr);
        }

        .score-btn-horizontal {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 6px 4px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: #333;
        }

        .score-btn-horizontal:hover {
          border-color: #1e40af;
          background: #f0f7ff;
        }

        .score-btn-horizontal.active {
          background: #1e40af;
          color: white;
          border-color: #1e40af;
        }
      `}</style>
    </div>
  );
}
