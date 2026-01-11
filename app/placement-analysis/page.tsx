'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';

interface GSATScores {
  chinese: number;
  english: number;
  math_a: number;
  math_b: number;
  social: number;
  nature: number;
}

interface BifurcatedScores {
  math_a: number;
  math_b: number;
  physics: number;
  chemistry: number;
  biology: number;
  history: number;
  geography: number;
  civic_society: number;
}

interface DepartmentResult {
  school_id: string;
  school_name: string;
  school_type: string;
  department_id: string;
  department_name: string;
  college: string;
  academic_group: string;
  quota: number | null;
  threshold_check: {
    all_pass: boolean;
    failed_subjects: string[];
  };
  score_calculation: {
    weighted_score: number;
    max_possible_score: number;
    score_percentage: number;
  };
  historical_comparison: {
    last_year_min_score: number | null;
    user_vs_min: number | null;
    probability_estimate: number;
  };
  confidence_level: 'high' | 'medium' | 'low' | 'very_low';
}

interface AnalysisResponse {
  success: boolean;
  summary: {
    total_departments: number;
    passed_threshold: number;
    failed_threshold: number;
    by_confidence: {
      high: number;
      medium: number;
      low: number;
      very_low: number;
    };
  };
  results: {
    high_confidence: DepartmentResult[];
    medium_confidence: DepartmentResult[];
    low_confidence: DepartmentResult[];
    very_low_confidence: DepartmentResult[];
    failed_threshold: DepartmentResult[];
  };
}

type SortOption = 'probability' | 'school_name' | 'weighted_score';
type FilterOption = 'all' | 'high' | 'medium' | 'low' | 'passed_only';

export default function PlacementAnalysis() {
  const [academicYear, setAcademicYear] = useState<number>(114);
  const [gsatScores, setGsatScores] = useState<GSATScores>({
    chinese: 0,
    english: 0,
    math_a: 0,
    math_b: 0,
    social: 0,
    nature: 0,
  });
  const [bifurcatedScores, setBifurcatedScores] = useState<BifurcatedScores>({
    math_a: 0,
    math_b: 0,
    physics: 0,
    chemistry: 0,
    biology: 0,
    history: 0,
    geography: 0,
    civic_society: 0,
  });
  const [englishListening, setEnglishListening] = useState<string>('A');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  
  const [sortBy, setSortBy] = useState<SortOption>('probability');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFailedThreshold, setShowFailedThreshold] = useState(false);

  const handleGsatChange = (subject: keyof GSATScores, value: string) => {
    const numValue = Math.min(15, Math.max(0, parseInt(value) || 0));
    setGsatScores(prev => ({ ...prev, [subject]: numValue }));
  };

  const handleBifurcatedChange = (subject: keyof BifurcatedScores, value: string) => {
    const numValue = Math.min(60, Math.max(0, parseInt(value) || 0));
    setBifurcatedScores(prev => ({ ...prev, [subject]: numValue }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // 過濾掉 0 分的科目
      const filteredGsat: Partial<GSATScores> = {};
      Object.entries(gsatScores).forEach(([key, value]) => {
        if (value > 0) filteredGsat[key as keyof GSATScores] = value;
      });
      
      const filteredBifurcated: Partial<BifurcatedScores> = {};
      Object.entries(bifurcatedScores).forEach(([key, value]) => {
        if (value > 0) filteredBifurcated[key as keyof BifurcatedScores] = value;
      });

      const response = await fetch('/api/placement-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academic_year: academicYear,
          admission_type: 'distribution_admission',
          gsat_scores: filteredGsat,
          bifurcated_scores: filteredBifurcated,
          english_listening: englishListening,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '分析失敗');
      }

      setResults(data);
    } catch (err: any) {
      setError(err.message || '發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 合併並排序結果
  const getSortedResults = (): DepartmentResult[] => {
    if (!results) return [];

    let allResults: DepartmentResult[] = [];

    // 根據過濾選項決定要包含哪些結果
    if (filterBy === 'all' || filterBy === 'passed_only') {
      allResults = [
        ...results.results.high_confidence,
        ...results.results.medium_confidence,
        ...results.results.low_confidence,
        ...results.results.very_low_confidence,
      ];
    } else if (filterBy === 'high') {
      allResults = [...results.results.high_confidence];
    } else if (filterBy === 'medium') {
      allResults = [...results.results.medium_confidence];
    } else if (filterBy === 'low') {
      allResults = [
        ...results.results.low_confidence,
        ...results.results.very_low_confidence,
      ];
    }

    // 排序
    return allResults.sort((a, b) => {
      switch (sortBy) {
        case 'probability':
          return b.historical_comparison.probability_estimate - a.historical_comparison.probability_estimate;
        case 'school_name':
          return a.school_name.localeCompare(b.school_name);
        case 'weighted_score':
          return b.score_calculation.weighted_score - a.score_calculation.weighted_score;
        default:
          return 0;
      }
    });
  };

  const getConfidenceLabel = (level: string): { text: string; color: string; bgColor: string } => {
    switch (level) {
      case 'high':
        return { text: '高', color: '#166534', bgColor: '#dcfce7' };
      case 'medium':
        return { text: '中', color: '#854d0e', bgColor: '#fef9c3' };
      case 'low':
      case 'very_low':
        return { text: '低', color: '#991b1b', bgColor: '#fee2e2' };
      default:
        return { text: '-', color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  const gsatSubjects = [
    { key: 'chinese', label: '國文' },
    { key: 'english', label: '英文' },
    { key: 'math_a', label: '數學A' },
    { key: 'math_b', label: '數學B' },
    { key: 'social', label: '社會' },
    { key: 'nature', label: '自然' },
  ];

  const bifurcatedSubjects = [
    { key: 'math_a', label: '數學甲' },
    { key: 'math_b', label: '數學乙' },
    { key: 'physics', label: '物理' },
    { key: 'chemistry', label: '化學' },
    { key: 'biology', label: '生物' },
    { key: 'history', label: '歷史' },
    { key: 'geography', label: '地理' },
    { key: 'civic_society', label: '公民' },
  ];

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <h1 style={styles.title}>🎯 分發入學落點分析</h1>
        <p style={styles.subtitle}>輸入您的學測與分科成績，分析各科系錄取機率</p>

        {/* 輸入區域 */}
        <div style={styles.inputSection}>
          {/* 學年度選擇 */}
          <div style={styles.yearSelect}>
            <label style={styles.label}>學年度：</label>
            <select 
              value={academicYear} 
              onChange={(e) => setAcademicYear(parseInt(e.target.value))}
              style={styles.select}
            >
              <option value={114}>114 學年度</option>
              <option value={115}>115 學年度</option>
            </select>
          </div>

          {/* 學測成績 */}
          <div style={styles.scoreSection}>
            <h3 style={styles.sectionTitle}>學測成績（15級分）</h3>
            <div style={styles.scoreGrid}>
              {gsatSubjects.map(({ key, label }) => (
                <div key={key} style={styles.scoreItem}>
                  <label style={styles.scoreLabel}>{label}</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={gsatScores[key as keyof GSATScores] || ''}
                    onChange={(e) => handleGsatChange(key as keyof GSATScores, e.target.value)}
                    style={styles.scoreInput}
                    placeholder="0-15"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 英聽成績 */}
          <div style={styles.listeningSection}>
            <label style={styles.label}>英聽等級：</label>
            <select 
              value={englishListening} 
              onChange={(e) => setEnglishListening(e.target.value)}
              style={styles.select}
            >
              <option value="A">A 級</option>
              <option value="B">B 級</option>
              <option value="C">C 級</option>
              <option value="F">F 級</option>
            </select>
          </div>

          {/* 分科成績 */}
          <div style={styles.scoreSection}>
            <h3 style={styles.sectionTitle}>分科成績（60級分）</h3>
            <div style={styles.scoreGrid}>
              {bifurcatedSubjects.map(({ key, label }) => (
                <div key={key} style={styles.scoreItem}>
                  <label style={styles.scoreLabel}>{label}</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={bifurcatedScores[key as keyof BifurcatedScores] || ''}
                    onChange={(e) => handleBifurcatedChange(key as keyof BifurcatedScores, e.target.value)}
                    style={styles.scoreInput}
                    placeholder="0-60"
                  />
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '分析中...' : '開始分析'}
          </button>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div style={styles.errorBox}>
            ❌ {error}
          </div>
        )}

        {/* 結果區域 */}
        {results && (
          <div style={styles.resultsSection}>
            {/* 統計摘要 */}
            <div style={styles.summary}>
              <h2 style={styles.summaryTitle}>📊 分析結果摘要</h2>
              <div style={styles.summaryGrid}>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>總科系數</span>
                  <span style={styles.summaryValue}>{results.summary.total_departments}</span>
                </div>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>通過門檻</span>
                  <span style={{ ...styles.summaryValue, color: '#166534' }}>
                    {results.summary.passed_threshold}
                  </span>
                </div>
                <div style={{ ...styles.summaryItem, ...styles.summaryHighlight }}>
                  <span style={styles.summaryLabel}>🟢 高機率</span>
                  <span style={styles.summaryValue}>{results.summary.by_confidence.high}</span>
                </div>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>🟡 中機率</span>
                  <span style={styles.summaryValue}>{results.summary.by_confidence.medium}</span>
                </div>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>🔴 低機率</span>
                  <span style={styles.summaryValue}>
                    {results.summary.by_confidence.low + results.summary.by_confidence.very_low}
                  </span>
                </div>
              </div>
            </div>

            {/* 排序和過濾 */}
            <div style={styles.controls}>
              <div style={styles.controlGroup}>
                <label style={styles.controlLabel}>排序方式：</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  style={styles.controlSelect}
                >
                  <option value="probability">機率高→低</option>
                  <option value="school_name">學校名稱</option>
                  <option value="weighted_score">加權分數</option>
                </select>
              </div>
              <div style={styles.controlGroup}>
                <label style={styles.controlLabel}>篩選：</label>
                <select 
                  value={filterBy} 
                  onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                  style={styles.controlSelect}
                >
                  <option value="all">全部顯示</option>
                  <option value="high">僅高機率</option>
                  <option value="medium">僅中機率</option>
                  <option value="low">僅低機率</option>
                  <option value="passed_only">通過門檻</option>
                </select>
              </div>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={showFailedThreshold}
                  onChange={(e) => setShowFailedThreshold(e.target.checked)}
                />
                顯示未通過門檻
              </label>
            </div>

            {/* 結果列表 */}
            <div style={styles.resultsList}>
              {getSortedResults().map((dept, index) => {
                const confidence = getConfidenceLabel(dept.confidence_level);
                return (
                  <div key={`${dept.school_id}-${dept.department_id}-${index}`} style={styles.resultCard}>
                    <div style={styles.cardHeader}>
                      <div style={styles.schoolInfo}>
                        <span style={styles.schoolType}>{dept.school_type}</span>
                        <span style={styles.schoolName}>{dept.school_name}</span>
                      </div>
                      <div 
                        style={{
                          ...styles.confidenceBadge,
                          backgroundColor: confidence.bgColor,
                          color: confidence.color,
                        }}
                      >
                        {confidence.text}機率
                      </div>
                    </div>
                    <div style={styles.deptName}>{dept.department_name}</div>
                    <div style={styles.cardDetails}>
                      <span style={styles.detailItem}>
                        📚 {dept.college}
                      </span>
                      <span style={styles.detailItem}>
                        🏷️ {dept.academic_group}
                      </span>
                      {dept.quota && (
                        <span style={styles.detailItem}>
                          👥 招生名額：{dept.quota}
                        </span>
                      )}
                    </div>
                    {dept.score_calculation.weighted_score > 0 && (
                      <div style={styles.scoreInfo}>
                        加權分數：{dept.score_calculation.weighted_score.toFixed(1)}
                        {dept.historical_comparison.last_year_min_score && (
                          <span style={styles.minScore}>
                            （去年最低：{dept.historical_comparison.last_year_min_score}）
                          </span>
                        )}
                      </div>
                    )}
                    {!dept.threshold_check.all_pass && (
                      <div style={styles.failedThreshold}>
                        ⚠️ 未通過門檻：{dept.threshold_check.failed_subjects.join('、')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 未通過門檻的科系 */}
            {showFailedThreshold && results.results.failed_threshold.length > 0 && (
              <div style={styles.failedSection}>
                <h3 style={styles.failedTitle}>
                  ❌ 未通過門檻的科系（{results.results.failed_threshold.length} 個）
                </h3>
                <div style={styles.failedList}>
                  {results.results.failed_threshold.slice(0, 20).map((dept, index) => (
                    <div key={`failed-${index}`} style={styles.failedItem}>
                      <span>{dept.school_name} - {dept.department_name}</span>
                      <span style={styles.failedReason}>
                        未達：{dept.threshold_check.failed_subjects.join('、')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '8px',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#64748b',
    marginBottom: '32px',
  },
  inputSection: {
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '32px',
  },
  yearSelect: {
    marginBottom: '24px',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#475569',
    marginRight: '12px',
  },
  select: {
    padding: '8px 16px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
  },
  scoreSection: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '12px',
  },
  scoreGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '12px',
  },
  scoreItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  scoreLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
  scoreInput: {
    padding: '10px 12px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    width: '100%',
    boxSizing: 'border-box',
  },
  listeningSection: {
    marginBottom: '24px',
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    fontSize: '1.125rem',
    fontWeight: 600,
    color: 'white',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '12px',
    marginTop: '16px',
  },
  errorBox: {
    padding: '16px',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  resultsSection: {
    marginTop: '32px',
  },
  summary: {
    backgroundColor: '#f0f9ff',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
  },
  summaryTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#0c4a6e',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px',
  },
  summaryItem: {
    textAlign: 'center',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '8px',
  },
  summaryHighlight: {
    backgroundColor: '#dcfce7',
  },
  summaryLabel: {
    display: 'block',
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '4px',
  },
  summaryValue: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1e293b',
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  controlLabel: {
    fontSize: '0.875rem',
    color: '#475569',
  },
  controlSelect: {
    padding: '8px 12px',
    fontSize: '0.875rem',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.875rem',
    color: '#475569',
    cursor: 'pointer',
  },
  resultsList: {
    display: 'grid',
    gap: '16px',
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  schoolInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  schoolType: {
    fontSize: '0.75rem',
    padding: '2px 8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    color: '#475569',
  },
  schoolName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1e293b',
  },
  confidenceBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  deptName: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '8px',
  },
  cardDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  detailItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  scoreInfo: {
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: '#f0f9ff',
    borderRadius: '6px',
    fontSize: '0.875rem',
    color: '#0369a1',
  },
  minScore: {
    marginLeft: '8px',
    color: '#64748b',
  },
  failedThreshold: {
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    borderRadius: '6px',
    fontSize: '0.875rem',
    color: '#991b1b',
  },
  failedSection: {
    marginTop: '32px',
    padding: '20px',
    backgroundColor: '#fef2f2',
    borderRadius: '12px',
  },
  failedTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#991b1b',
    marginBottom: '16px',
  },
  failedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  failedItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    fontSize: '0.875rem',
  },
  failedReason: {
    color: '#991b1b',
    fontSize: '0.75rem',
  },
};
