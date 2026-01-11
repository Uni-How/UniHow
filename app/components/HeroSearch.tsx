'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

// --- HeroSearch Component (首頁搜尋組件) ---
// 這是使用者與系統互動的第一個入口，負責收集所有篩選條件。

export default function HeroSearch() {
  const router = useRouter();
  
  // States (表單狀態)
  const [academicYear, setAcademicYear] = useState('115'); // Default 115學年度
  const [admissionMethod, setAdmissionMethod] = useState('distribution_admission'); // 暫時僅開放分發
  const [isMethodOpen, setIsMethodOpen] = useState(false);
  const [isListeningOpen, setIsListeningOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [expandedScoreType, setExpandedScoreType] = useState<'gsat' | 'bifurcated' | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [multiSelectOpen, setMultiSelectOpen] = useState<'group' | 'region' | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  
  // 成績輸入狀態 (對應各科目)
  // 這裡使用 string 是為了方便處理空值輸入
  const [scores, setScores] = useState({
    chinese: '',
    english: '',
    mathA: '',
    mathB: '',
    science: '',
    social: ''
  });
  const [listening, setListening] = useState(''); // 初始為空（無=不篩選）
  const [publicPrivate, setPublicPrivate] = useState(''); // 公私立
  
  // 分科測驗成績 (滿分為 60 級分)
  const [bifurcatedScores, setBifurcatedScores] = useState({
    mathIA: '',      // 數學甲
    mathIB: '',      // 數學乙
    physics: '',     // 物理
    chemistry: '',   // 化學
    biology: '',     // 生物
    history: '',     // 歷史
    geography: '',   // 地理
    civics: ''       // 公民與社會
  });
  
  // 新增：從 API 載入的學群選項 (Dynamic Metadata)
  // 透過 API 獲取資料庫中實際存在的學群列表，避免寫死
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  // 載入學群選項
  useEffect(() => {
    async function loadMetadata() {
      try {
        const res = await fetch('/api/schools?limit=1'); // 請求少量資料以取得 metadata
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

  // Logic: Handle year changes
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
      const isInside = Object.values(dropdownRefs.current).some((ref) => ref && ref.contains(target));
      if (!isInside) {
        setIsMethodOpen(false);
        setIsListeningOpen(false);
        setIsTypeOpen(false);
        setMultiSelectOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 15 to 1 (級分下拉選單生成用)
  const LEVELS = Array.from({ length: 15 }, (_, i) => 15 - i);

  // 60 to 1 (分科測驗級分 1-60)
  const BIFURCATED_LEVELS = Array.from({ length: 60 }, (_, i) => 60 - i);

  const REGION_OPTIONS = [
    '北北基',
    '桃竹苗',
    '中彰投',
    '雲嘉南',
    '高屏',
    '宜花東',
    '離島'
  ];

  const toggleGroupSelection = (value: string) => {
    setSelectedGroups((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleRegionSelection = (value: string) => {
    setSelectedRegions((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleScoreChange = (subject: string, value: string) => {
    setScores(prev => ({ ...prev, [subject]: value }));
  };

  const handleBifurcatedScoreChange = (subject: string, value: string) => {
    setBifurcatedScores(prev => ({ ...prev, [subject]: value }));
  };

  // Handle Search (執行搜尋)
  // 將所有狀態組合成 URL Query Params 並跳轉至 /results 頁面
  const handleSearch = () => {
    const params = new URLSearchParams();
    
    params.set('year', academicYear);
    params.set('method', admissionMethod);
    // 僅加入有填寫的成績
    if (scores.chinese) params.set('chinese', scores.chinese);
    if (scores.english) params.set('english', scores.english);
    if (scores.mathA) params.set('mathA', scores.mathA);
    if (scores.mathB) params.set('mathB', scores.mathB);
    if (scores.science) params.set('science', scores.science);
    if (scores.social) params.set('social', scores.social);
    
    if (listening) params.set('listening', listening);
    if (selectedGroups.length) params.set('group', selectedGroups.join(','));
    if (publicPrivate) params.set('type', publicPrivate);
    if (selectedRegions.length) params.set('region', selectedRegions.join(','));

    // 添加分科測驗成績到 URL
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
    <div className="hero-search-container">
      {/* Tab Navigation */}
      <div className="hero-tabs">
        <button className="hero-tab-search">以成績搜尋</button>
        <button 
          className="hero-tab-pill"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
        >
          {isAdvancedOpen ? '隱藏進階搜尋 ▲' : '進階搜尋 ▼'}
        </button>
      </div>

      {/* Main Filter Bar */}
      <div className={`filter-bar ${isAdvancedOpen ? 'has-below' : ''}`}>
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
                setMultiSelectOpen(null);
                setIsTypeOpen(false);
              }}
            >
              {admissionMethod === 'distribution_admission' ? '分發入學' : '請選擇'}
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

        {/* Scores Display (簡潔顯示) */}
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
                setMultiSelectOpen(null);
                setIsTypeOpen(false);
              }}
            >
              {listening || '無（不篩選）'}
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

      {/* Advanced Search Bar Layer */}
      {isAdvancedOpen && (
      <div className="filter-bar-advanced">
        {/* Academic Group - 進階搜尋 */}
        <div
          className="filter-group group-pref"
          ref={(node) => { dropdownRefs.current.group = node; }}
        >
          <label>學群偏好</label>
          <div className="custom-dropdown">
            <button
              type="button"
              className="dropdown-toggle"
              onClick={() => {
                setMultiSelectOpen('group');
                setIsMethodOpen(false);
                setIsListeningOpen(false);
                setIsTypeOpen(false);
              }}
            >
              {selectedGroups.length ? selectedGroups.join('、') : '全部'}
              <span className="dropdown-caret">▾</span>
            </button>
          </div>
        </div>

        {/* Public/Private - 進階搜尋 */}
        <div
          className="filter-group type"
          ref={(node) => { dropdownRefs.current.type = node; }}
        >
          <label>公/私立</label>
          <div className="custom-dropdown">
            <button
              type="button"
              className="dropdown-toggle"
              onClick={() => {
                setIsTypeOpen((prev) => !prev);
                setIsMethodOpen(false);
                setIsListeningOpen(false);
                setMultiSelectOpen(null);
              }}
            >
              {publicPrivate || '全部'}
              <span className="dropdown-caret">▾</span>
            </button>
            {isTypeOpen && (
              <div className="dropdown-menu">
                {[{ value: '', label: '全部' }, { value: '公立', label: '公立' }, { value: '私立', label: '私立' }].map((option) => (
                  <button
                    key={option.value || 'all'}
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setPublicPrivate(option.value);
                      setIsTypeOpen(false);
                    }}
                  >
                    <div className="item-row"><span>{option.label}</span></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Region - 進階搜尋 */}
        <div
          className="filter-group region"
          ref={(node) => { dropdownRefs.current.region = node; }}
        >
          <label>地區</label>
          <div className="custom-dropdown">
            <button
              type="button"
              className="dropdown-toggle"
              onClick={() => {
                setMultiSelectOpen('region');
                setIsMethodOpen(false);
                setIsListeningOpen(false);
                setIsTypeOpen(false);
              }}
            >
              {selectedRegions.length ? selectedRegions.join('、') : '全部'}
              <span className="dropdown-caret">▾</span>
            </button>
          </div>
        </div>
      </div>
      )}

      {multiSelectOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="modal-backdrop"
            onClick={() => setMultiSelectOpen(null)}
          />

          <div className="multi-modal-wrapper">
            <div className="multi-modal">
              <div className="modal-header">
                <h3>{multiSelectOpen === 'group' ? '學群偏好' : '地區'}</h3>
                <button
                  className="modal-confirm-inline"
                  onClick={() => setMultiSelectOpen(null)}
                >
                  確認
                </button>
              </div>

              <div className="multi-body">
                <div className="chip-row">
                  <button
                    className="chip-button"
                    onClick={() => {
                      if (multiSelectOpen === 'group') {
                        setSelectedGroups([]);
                      } else {
                        setSelectedRegions([]);
                      }
                    }}
                  >
                    清空
                  </button>
                  <div className="selected-text">
                    已選：{multiSelectOpen === 'group'
                      ? (selectedGroups.length ? selectedGroups.join('、') : '未選')
                      : (selectedRegions.length ? selectedRegions.join('、') : '未選')}
                  </div>
                </div>

                <div className="multi-grid">
                  {(multiSelectOpen === 'group' ? availableGroups : REGION_OPTIONS).map((item) => {
                    const isActive = multiSelectOpen === 'group'
                      ? selectedGroups.includes(item)
                      : selectedRegions.includes(item);
                    return (
                      <button
                        key={item}
                        className={`multi-option ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          if (multiSelectOpen === 'group') {
                            toggleGroupSelection(item);
                          } else {
                            toggleRegionSelection(item);
                          }
                        }}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Score Input Modal */}
      {expandedScoreType && typeof document !== 'undefined' && createPortal(
        <>
          {/* Modal Backdrop */}
          <div 
            className="modal-backdrop"
            onClick={() => {
              setExpandedScoreType(null);
              setSelectedSubject(null);
              setFocusedInput(null);
            }}
          />
          
          {/* Modal Content */}
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
                                // Enter键跳转到下一个未输入的科目
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
                                // 自动跳转到下一个未输入的科目
                                const subjects = ['chinese', 'english', 'mathA', 'mathB', 'science', 'social'];
                                const currentIndex = subjects.indexOf(selectedSubject);
                                for (let i = currentIndex + 1; i < subjects.length; i++) {
                                  if (!scores[subjects[i] as keyof typeof scores]) {
                                    setTimeout(() => setSelectedSubject(subjects[i]), 50);
                                    return;
                                  }
                                }
                                // 如果没有未输入的科目，从头找
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
                                // Enter键跳转到下一个未输入的科目
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
                                // 自动跳转到下一个未输入的科目
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
        .hero-search-container {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          font-family: 'Outfit', sans-serif;
          position: relative;
        }

        .hero-tabs {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding: 0 4px;
        }

        .hero-tab-search {
          background: #1e40af;
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .hero-tab-search:hover {
          background: #1e3a8a;
        }

        .hero-tab-search:active {
          transform: scale(0.98);
        }

        .hero-tab-pill {
          background: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 6px 16px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          color: #333;
          font-weight: 500;
        }

        .hero-tab-pill:hover {
          background: #f0f0f0;
        }

        .filter-bar {
          background: white;
          border-radius: 20px;
          padding: 14px 10px;
          display: flex;
          align-items: stretch;
          gap: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: visible;
          border: 1px solid #e1e1e1;
          position: relative;
          transition: border-radius 0.3s ease;
        }

        .filter-bar.has-below {
          border-radius: 20px 20px 0 0;
        }

        .filter-bar-advanced {
          background: white;
          border-radius: 0 0 20px 20px;
          padding: 14px 10px;
          display: flex;
          align-items: stretch;
          gap: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: visible;
          border: 1px solid #e1e1e1;
          border-top: none;
          position: relative;
          z-index: 50;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
          }
        }

        .filter-group {
          padding: 8px 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-right: 1px solid #eee;
          min-width: 80px;
        }

        .filter-group:last-of-type {
          border-right: none;
        }

        .search-btn {
          border-right: none;
        }

        .filter-group label {
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .filter-select {
          border: none;
          background: none;
          font-size: 1rem;
          font-weight: 600;
          color: #333;
          outline: none;
          cursor: pointer;
          padding: 0;
          width: 100%;
        }

        .method {
           background: #fae8b4;
           border-radius: 0;
           margin: -14px 0 -14px -10px;
           padding: 10px 20px;
        }

        .listening {
          min-width: 60px !important;
          padding: 0 10px !important;
        }

        .listening label {
          font-size: 0.7rem !important;
        }

        .listening .dropdown-toggle {
          font-size: 0.9rem !important;
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
          font-size: 1rem;
          font-weight: 600;
          color: #333;
          cursor: pointer;
          padding: 0;
        }

        .dropdown-caret {
          font-size: 0.8rem;
          color: #666;
          margin-left: 8px;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 180px;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          z-index: 80;
          overflow: hidden;
        }

        .dropdown-item {
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          background: white;
          border: none;
          cursor: pointer;
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
          font-size: 0.7rem;
          color: #9ca3af;
          margin-top: 2px;
        }

        .item-row {
          display: flex;
          flex-direction: column;
        }

        .filter-bar-secondary {
          background: white;
          border-radius: 0 0 20px 20px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #e1e1e1;
          border-top: none;
          flex-wrap: wrap;
        }

        .secondary-label {
          font-size: 0.75rem;
          color: #666;
          font-weight: 600;
          white-space: nowrap;
        }

        .bifurcated-inputs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          flex: 1;
        }

        .bifurcated-input {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          background: #f9f9f9;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid #ddd;
        }

        .bifurcated-input span {
          font-size: 0.85rem;
          font-weight: 600;
          color: #333;
        }

        .bifurcated-select {
          border: 1px solid #ccc;
          background: white;
          font-size: 0.85rem;
          font-weight: 500;
          color: #333;
          outline: none;
          width: 50px;
          padding: 2px 4px;
          cursor: pointer;
          border-radius: 4px;
        }

        .bifurcated-select:focus {
          border-color: #3b82f6;
        }

        /* New Scores Display Styles */
        .scores-display {
          flex: 1.2;
          padding: 0 16px !important;
          border-right: 1px solid #eee !important;
          min-width: 280px;
        }

        .scores-text-container {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: flex-start;
        }

        .scores-text-line {
          display: flex;
          align-items: center;
          flex-wrap: nowrap;
          gap: 12px;
          font-size: 0.9rem;
          color: #333;
          line-height: 1.4;
          min-width: 0;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .scores-text-line:hover {
          background: #f5f5f5;
        }

        .scores-text-line span:first-child {
          font-weight: 600;
          font-size: 0.9rem;
          color: #333;
          min-width: 45px;
        }

        .scores-value {
          font-size: 0.9rem;
          color: #666;
          font-family: monospace;
          display: flex;
          align-items: center;
        }

        .scores-title {
          font-weight: 700;
          font-size: 0.9rem;
          color: #333;
          margin-right: 4px;
          white-space: nowrap;
          display: flex;
          align-items: center;
        }

        /* Expanded Score Sections */
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

        .multi-modal-wrapper {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1001;
          width: min(720px, calc(100vw - 48px));
        }

        .multi-modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 16px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: min(520px, calc(100vh - 140px));
          overflow: hidden;
        }

        .multi-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
        }

        .chip-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .chip-button {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 6px 12px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .chip-button:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .selected-text {
          color: #555;
          font-size: 0.9rem;
          flex: 1;
          min-width: 200px;
        }

        .multi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
          overflow-y: auto;
          padding-right: 4px;
          max-height: 360px;
        }

        .multi-option {
          border: 1px solid #d9e2ec;
          background: #f8fafc;
          border-radius: 10px;
          padding: 10px 12px;
          text-align: center;
          cursor: pointer;
          font-weight: 600;
          color: #0f172a;
          transition: all 0.15s ease;
        }

        .multi-option:hover {
          border-color: #1e40af;
          background: #eef2ff;
        }

        .multi-option.active {
          background: #1e40af;
          color: white;
          border-color: #1e40af;
          box-shadow: 0 6px 14px rgba(30, 64, 175, 0.25);
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

        /* removed modal-confirm-btn (replaced by inline button) */

        .search-btn {
          background: #0f172a; /* Dark blue */
          color: white;
          border: none;
          border-radius: 14px;
          padding: 0 24px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          margin-left: 10px; /* Space from last item */
          white-space: nowrap;
        }

        .search-btn:hover {
          background: #1e293b;
        }

        .year-toggle {
          display: flex;
          background: #f0f0f0;
          border-radius: 8px;
          padding: 2px;
          gap: 2px;
        }

        .year-btn {
          border: none;
          background: none;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.9rem;
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
      `}</style>
    </div>
  );
}
