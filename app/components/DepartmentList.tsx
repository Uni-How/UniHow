'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

interface PlacementAnalysis {
  threshold_check: {
    all_pass: boolean;
    failed_subjects: string[];
    details: {
      subject: string;
      threshold: string;
      userLevel: number;
      requiredLevel: number;
      pass: boolean;
      group?: number;
    }[];
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

interface Department {
  department_id: string;
  department_name: string;
  college: string;
  academic_group: string;
  campus_ids: string[];
  admission_data?: any;
  placement_analysis?: PlacementAnalysis | null;
}

interface ISchool {
  _id: string;
  school_id: string;
  school_name: string;
  departments: Department[];
  placement_summary?: {
    total_departments: number;
    passed_threshold: number;
    failed_threshold: number;
  };
}

interface DepartmentListProps {
  school: ISchool | null;
  selectedYear: '114' | '115';
  selectedDeptIndex: number;
  onSelectDept: (index: number) => void;
  onYearChange: (year: '114' | '115') => void;
  showFailedThreshold?: boolean;
  onToggleShowFailed?: (show: boolean) => void;
  isLoadingDetail?: boolean;
}

type SortOption = 'default' | 'probability_high' | 'probability_low' | 'name';

export default function DepartmentList({ 
  school, 
  selectedYear, 
  selectedDeptIndex, 
  onSelectDept,
  onYearChange,
  showFailedThreshold = false,
  onToggleShowFailed,
  isLoadingDetail = false
}: DepartmentListProps) {
  const searchParams = useSearchParams();
  const method = searchParams.get('method') || 'personal_application';
  const [sortBy, setSortBy] = useState<SortOption>('probability_high');

  // 檢查是否有成績輸入 (啟用落點分析模式)
  const hasScores = useMemo(() => {
    const scoreKeys = ['chinese', 'english', 'mathA', 'mathB', 'science', 'social'];
    const bifurcatedKeys = ['bifurcatedMathIA', 'bifurcatedMathIB', 'bifurcatedPhysics', 
      'bifurcatedChemistry', 'bifurcatedBiology', 'bifurcatedHistory', 
      'bifurcatedGeography', 'bifurcatedCivics'];
    return [...scoreKeys, ...bifurcatedKeys].some(k => searchParams.has(k));
  }, [searchParams]);

  // 排序後的科系列表
  const sortedDepartments = useMemo(() => {
    if (!school) return [];
    
    let depts = [...school.departments];
    
    if (hasScores && sortBy !== 'default') {
      depts.sort((a, b) => {
        const aAnalysis = a.placement_analysis;
        const bAnalysis = b.placement_analysis;
        
        // 沒有分析資料的排最後
        if (!aAnalysis && !bAnalysis) return 0;
        if (!aAnalysis) return 1;
        if (!bAnalysis) return -1;
        
        // 未通過門檻的排後面 (如果顯示的話)
        if (!aAnalysis.threshold_check.all_pass && bAnalysis.threshold_check.all_pass) return 1;
        if (aAnalysis.threshold_check.all_pass && !bAnalysis.threshold_check.all_pass) return -1;
        
        switch (sortBy) {
          case 'probability_high':
            return bAnalysis.historical_comparison.probability_estimate - 
                   aAnalysis.historical_comparison.probability_estimate;
          case 'probability_low':
            return aAnalysis.historical_comparison.probability_estimate - 
                   bAnalysis.historical_comparison.probability_estimate;
          case 'name':
            return a.department_name.localeCompare(b.department_name);
          default:
            return 0;
        }
      });
    }
    
    return depts;
  }, [school, sortBy, hasScores]);

  const getConfidenceInfo = (level: string | undefined): { label: string; color: string; bgColor: string } => {
    switch (level) {
      case 'high':
        return { label: '高', color: '#166534', bgColor: '#dcfce7' };
      case 'medium':
        return { label: '中', color: '#854d0e', bgColor: '#fef9c3' };
      case 'low':
      case 'very_low':
        return { label: '低', color: '#991b1b', bgColor: '#fee2e2' };
      default:
        return { label: '-', color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  if (!school) {
    return (
      <div className="department-panel">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
          請選擇一所學校
        </div>
      </div>
    );
  }

  const failedCount = school.placement_summary?.failed_threshold || 0;

  return (
    <div className="department-panel">
      <h3 style={{ 
        fontSize: '1rem', 
        fontWeight: 600, 
        marginBottom: '0.75rem',
        color: '#333'
      }}>
        {school.school_name} - 科系列表
      </h3>

      {/* Year Toggle */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '0.75rem',
        padding: '0.25rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <button 
          onClick={() => onYearChange('114')}
          style={{
            flex: 1,
            padding: '0.4rem',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: selectedYear === '114' ? '#0F5AA8' : 'white',
            color: selectedYear === '114' ? 'white' : '#333',
            fontWeight: selectedYear === '114' ? 'bold' : 'normal',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          114學年
        </button>
        <button 
          onClick={() => onYearChange('115')}
          style={{
            flex: 1,
            padding: '0.4rem',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: selectedYear === '115' ? '#0F5AA8' : 'white',
            color: selectedYear === '115' ? 'white' : '#333',
            fontWeight: selectedYear === '115' ? 'bold' : 'normal',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          115學年
        </button>
      </div>

      {/* 排序選項 (僅在有成績時顯示) */}
      {hasScores && (
        <div style={{ 
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <label style={{ fontSize: '0.8rem', color: '#666' }}>排序：</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            style={{
              padding: '0.3rem 0.5rem',
              fontSize: '0.8rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              backgroundColor: 'white'
            }}
          >
            <option value="probability_high">機率高→低</option>
            <option value="probability_low">機率低→高</option>
            <option value="name">科系名稱</option>
            <option value="default">預設順序</option>
          </select>
        </div>
      )}

      {/* 未通過門檻的科系選項 */}
      {hasScores && failedCount > 0 && onToggleShowFailed && (
        <div style={{
          marginBottom: '0.75rem',
          padding: '0.5rem',
          backgroundColor: showFailedThreshold ? '#fef2f2' : '#f0f9ff',
          borderRadius: '6px',
          fontSize: '0.8rem'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            cursor: 'pointer',
            color: showFailedThreshold ? '#991b1b' : '#0369a1'
          }}>
            <input
              type="checkbox"
              checked={showFailedThreshold}
              onChange={(e) => onToggleShowFailed(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            顯示未通過門檻的科系（{failedCount} 個）
          </label>
        </div>
      )}

      <div style={{ 
        fontSize: '0.8rem', 
        color: '#666', 
        marginBottom: '0.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>共 {sortedDepartments.length} 個科系</span>
        {hasScores && school.placement_summary && (
          <span style={{ color: '#166534' }}>
            ✓ 通過門檻 {school.placement_summary.passed_threshold} 個
          </span>
        )}
      </div>

      <div className="department-items">
        {sortedDepartments.map((dept, idx) => {
          const deptAdmissionData = dept.admission_data?.[selectedYear];
          const hasData = deptAdmissionData?.plans && Object.keys(deptAdmissionData.plans).length > 0;
          const analysis = dept.placement_analysis;
          const confidenceInfo = analysis ? getConfidenceInfo(analysis.confidence_level) : null;
          const isFailedThreshold = analysis && !analysis.threshold_check.all_pass;

          // 找到原始 index (用於 onSelectDept)
          const originalIndex = school.departments.findIndex(d => d.department_id === dept.department_id);

          return (
            <div 
              key={`${dept.department_id}-${idx}`} 
              onClick={() => onSelectDept(originalIndex >= 0 ? originalIndex : idx)}
              className={`department-item ${originalIndex === selectedDeptIndex ? 'selected' : ''}`}
              style={{
                opacity: isFailedThreshold ? 0.7 : 1,
                borderLeft: isFailedThreshold ? '3px solid #ef4444' : undefined,
              }}
            >
              <div className="dept-main">
                <span className="dept-name">{dept.department_name}</span>
                <span className="dept-college">{dept.academic_group || '其他'}</span>
              </div>
              <div className="dept-right" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* 機率標籤 */}
                {hasScores && analysis && analysis.threshold_check.all_pass && confidenceInfo && (
                  <span 
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: confidenceInfo.bgColor,
                      color: confidenceInfo.color,
                    }}
                  >
                    {confidenceInfo.label}機率
                  </span>
                )}
                {/* 未通過門檻標記 */}
                {isFailedThreshold && (
                  <span 
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                    }}
                  >
                    未達門檻
                  </span>
                )}
                {/* 載入中顯示 loading，載入完成後若無資料且為115年度則顯示待公告 */}
                {!hasData && isLoadingDetail && (
                  <span className="dept-loading">載入中...</span>
                )}
                {!hasData && !isLoadingDetail && selectedYear === '115' && (
                  <span className="dept-pending">待公告</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
