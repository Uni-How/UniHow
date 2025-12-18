'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

interface ISchool {
  _id: string;
  school_id: string;
  school_name: string;
  school_type: string;
  school_images: string[];
  school_url?: string;
  campuses: {
    campus_id: string;
    campus_name: string;
    is_main: boolean;
    location: {
      city: string;
      district: string;
      address: string;
      google_map_url?: string;
    };
  }[];
  departments: {
    department_id: string;
    department_name: string;
    college: string;
    academic_group: string;
    campus_ids: string[];
    admission_data?: any;
  }[];
}

interface SchoolDetailProps {
  school: ISchool | null;
}

// --- SchoolDetail Component (學校詳情面板) ---
// 顯示選定學校的詳細資訊，包含歷年錄取標準、篩選倍率等。
// 此組件位於右側欄位。

interface SchoolDetailProps {
  school: ISchool | null;
}

export default function SchoolDetail({ school }: SchoolDetailProps) {
  const searchParams = useSearchParams();
  
  // 內部狀態：控制顯示 114 或 115 學年度
  const [selectedYear, setSelectedYear] = useState<'114' | '115'>('114'); // 預設為114學年（有完整資料）
  const [selectedDeptIndex, setSelectedDeptIndex] = useState<number>(0);

  // 提取 method 作為獨立值 (從 URL 獲取當前搜尋的管道)
  const method = searchParams.get('method') || 'personal_application';

  // 使用 useMemo 確保當 selectedYear 或 selectedDeptIndex 或 method 改變時，planData 會重新計算
  // 效能優化：避免每次 render 都重新尋找深層物件
  const planData = useMemo(() => {
    if (!school) return null; // Safe guard (空值保護)
    
    // 取得選定的科系
    const selectedDept = school.departments[selectedDeptIndex];
    // 取得該科系在指定學年度的入學資料
    const admissionData = selectedDept?.admission_data?.[selectedYear];
    
    // 根據 method (e.g. star_plan) 動態選擇對應的計畫內容
    return admissionData?.plans?.[method];
  }, [school, selectedDeptIndex, selectedYear, method]); // 依賴項改變時才重新執行

  // 若未選擇學校，顯示預設提示
  if (!school) {
    return (
      <aside className="detail">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
          請選擇一所學校查看詳情
        </div>
      </aside>
    );
  }

  const getSchoolImage = (school: ISchool) => {
    if (school.school_images && school.school_images.length > 0) {
      return school.school_images[0];
    }
    return `https://placehold.co/800x400/e0e0e0/666?text=${encodeURIComponent(school.school_name)}`;
  };

  return (
    <aside className="detail">
      <div className="detail-top">
        <img 
          className="rounded main-hero" 
          src={getSchoolImage(school)} 
          alt="校園主圖"
          loading="lazy"
        />
        <img 
          className="rounded thumb-sm" 
          src={school?.school_images?.[1] || getSchoolImage(school)} 
          alt="校園縮圖"
          loading="lazy"
        />
        <div className="map-card">
          <div className="map-pattern" aria-hidden="true"></div>
          <button className="map-btn">
            <span>查看地圖</span>
            <span className="map-icon" aria-hidden="true"></span>
          </button>
        </div>
      </div>

      <h2 className="uni-title">{school.school_name}</h2>
      <div className="meta-links">
        <a href={school.school_url || '#'} target="_blank" rel="noopener noreferrer">校務資訊</a>
        <span className="dot"></span>
        <a href="#">傳送</a>
      </div>

      {/* Year Toggle */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1rem',
        padding: '0.5rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <button 
          onClick={() => setSelectedYear('114')}
          style={{
            flex: 1,
            padding: '0.5rem',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: selectedYear === '114' ? '#0F5AA8' : 'white',
            color: selectedYear === '114' ? 'white' : '#333',
            fontWeight: selectedYear === '114' ? 'bold' : 'normal',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          114學年
        </button>
        <button 
          onClick={() => setSelectedYear('115')}
          style={{
            flex: 1,
            padding: '0.5rem',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: selectedYear === '115' ? '#0F5AA8' : 'white',
            color: selectedYear === '115' ? 'white' : '#333',
            fontWeight: selectedYear === '115' ? 'bold' : 'normal',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          115學年
        </button>
      </div>

      <div className="pill-tabs">
        <button className="pill active">科系列表</button>
        <button className="pill">校園資訊</button>
      </div>

      <div className="detail-bottom">
        <div className="department-list" style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          marginBottom: '1rem',
          padding: '0.5rem',
          border: '1px solid #e0e0e0',
          borderRadius: '4px'
        }}>
          {school.departments.map((dept, idx) => {
            const deptAdmissionData = dept.admission_data?.[selectedYear];
            const hasData = deptAdmissionData?.plans && Object.keys(deptAdmissionData.plans).length > 0;

            return (
              <div 
                key={idx} 
                onClick={() => setSelectedDeptIndex(idx)}
                style={{ 
                  padding: '0.75rem',
                  borderBottom: idx < school.departments.length - 1 ? '1px solid #f0f0f0' : 'none',
                  cursor: 'pointer',
                  backgroundColor: idx === selectedDeptIndex ? '#f0f7ff' : 'transparent',
                  borderLeft: idx === selectedDeptIndex ? '3px solid #0F5AA8' : '3px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                  {dept.department_name}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span>{dept.college}</span>
                  <span>•</span>
                  <span className="tag blue" style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem' }}>
                    {dept.academic_group || '其他'}
                  </span>
                  {!hasData && selectedYear === '115' && (
                    <>
                      <span>•</span>
                      <span style={{ color: '#ff9800', fontStyle: 'italic' }}>簡章待公告</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="detailed-information">
          {planData?.last_year_pass_data ? (
            <div className="selection-order">
              <div className="so-table">
                <div className="so-head">去年({selectedYear === '115' ? '114' : '113'})最低通過級分與篩選順序</div>
                <div className="so-body">
                  {planData.last_year_pass_data.passing_sequence && planData.last_year_pass_data.passing_sequence.length > 0 ? (
                    <div className="so-row scores">
                      {planData.last_year_pass_data.passing_sequence.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="col">
                            <div className="label">{item.subject}</div>
                            <div className="value">{item.grade || '--'}</div>
                            {item.note && <div style={{ fontSize: '0.7rem', color: '#666' }}>({item.note})</div>}
                          </div>
                          {idx < Math.min(planData.last_year_pass_data.passing_sequence.length - 1, 2) && (
                            <div className="arrow" aria-hidden="true">→</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="so-row placeholder">
                      <div className="col"><div className="value muted">尚無資料</div></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="selection-order">
              <div className="so-table">
                <div className="so-head">去年({selectedYear === '115' ? '114' : '113'})最低通過級分與篩選順序</div>
                <div className="so-body">
                  <div className="so-row placeholder">
                    <div className="col"><div className="value muted">資料尚未提供</div></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="data-table">
            <div className="thead">
              <div>科目</div>
              <div>門檻</div>
              <div>倍率</div>
            </div>
            {planData?.exam_thresholds && planData.exam_thresholds.length > 0 ? (
              planData.exam_thresholds.map((threshold: any, idx: number) => {
                // 找到對應的倍率資料
                const multiplier = planData.selection_multipliers?.find(
                  (m: any) => m.subject === threshold.subject
                );
                
                return (
                  <div key={idx} className="trow">
                    <div>{threshold.subject}</div>
                    <div>{threshold.threshold || '--'}</div>
                    <div>{multiplier?.multiplier ? `x${multiplier.multiplier}` : '--'}</div>
                  </div>
                );
              })
            ) : (
              <>
                <div className="trow">
                  <div>國文</div><div>--</div><div>--</div>
                </div>
                <div className="trow">
                  <div>英文</div><div>--</div><div>--</div>
                </div>
                <div className="trow">
                  <div>數學A</div><div>--</div><div>--</div>
                </div>
                <div className="trow">
                  <div>自然</div><div>--</div><div>--</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="foot-note">
        Collegeo ➜ <a href="#">查看全部</a>
      </div>

      <div className="small-note">
        去年({selectedYear === '115' ? '114' : '113'})最低通過分與篩選順序
      </div>
    </aside>
  );
}
