'use client';

import { memo } from 'react';

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

// --- SchoolCard Component (學校卡片) ---
// 列表中的單一學校項目。
// 使用 memo 進行優化，避免在父組件 (ResultsPage) 狀態更新時造成不必要的重繪。

interface SchoolCardProps {
  school: ISchool;
  isSelected: boolean;
  onClick: () => void;
}

function SchoolCard({ school, isSelected, onClick }: SchoolCardProps) {
  const getMainLocation = (school: ISchool) => {
    const mainCampus = school.campuses.find(c => c.is_main);
    if (mainCampus) {
      return `${mainCampus.location.city}${mainCampus.location.district}`;
    }
    return school.campuses[0] ? `${school.campuses[0].location.city}${school.campuses[0].location.district}` : '未知';
  };

  const getSchoolImage = (school: ISchool) => {
    const urls = school.school_images || [];
    const hasImageExt = (u: string) => /\.(jpg|jpeg|png|webp|gif|svg)(\?|#|$)/i.test(u);

    for (const raw of urls) {
      const clean = raw?.trim();
      if (!clean) continue;
      const normalized = clean.replace(/\s+/g, '');
      try {
        // 確保是 http/https 並且看起來像圖片連結
        const urlObj = new URL(normalized);
        if ((urlObj.protocol === 'http:' || urlObj.protocol === 'https:') && hasImageExt(urlObj.pathname + urlObj.search)) {
          return urlObj.toString();
        }
      } catch (e) {
        // ignore invalid URL
      }
    }

    // fallback placeholder
    return `https://placehold.co/800x400/e0e0e0/666?text=${encodeURIComponent(school.school_name)}`;
  };

  return (
    <article 
      className={`card horiz ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ 
        cursor: 'pointer',
        outline: isSelected ? '2px solid #0F5AA8' : undefined,
        outlineOffset: '-2px',
        transform: isSelected ? 'translateX(4px)' : undefined,
        transition: 'outline 0.2s ease, transform 0.2s ease'
      }}
    >
      <div className="thumb">
        <img 
          src={getSchoolImage(school)} 
          alt={`${school.school_name}校園照片`} 
          loading="lazy"
        />
      </div>
      <div className="card-body">
        <div className="card-top">
          <h3>{school.school_name}</h3>
          <div className="kv small">可填科系數 <strong>{school.departments.length}</strong></div>
        </div>
        <div className="sub">{getMainLocation(school)}</div>
        <div className="tags">
          {(() => {
            const uniqueGroups = Array.from(new Set(school.departments.map(d => d.academic_group).filter(Boolean)));
            const displayedGroups = uniqueGroups.slice(0, 4);
            const remainingCount = uniqueGroups.length - 4;

            return (
              <>
                {displayedGroups.map((group, index) => (
                  <span 
                    key={`${group}-${index}`}
                    className="tag"
                    style={{ 
                      backgroundColor: 'transparent',
                      color: '#0F5AA8',
                      fontWeight: 600,
                      border: '1px solid #0F5AA8',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '12px',
                      height: 'auto'
                    }}
                  >
                    {group}
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span key="remaining-count" className="tag" style={{ 
                    backgroundColor: 'transparent',
                    color: '#999',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '12px',
                    height: 'auto'
                  }}>
                    還有{remainingCount}個
                  </span>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </article>
  );
}

export default memo(SchoolCard);
