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
    if (school.school_images && school.school_images.length > 0) {
      return school.school_images[0];
    }
    return `https://placehold.co/800x400/e0e0e0/666?text=${encodeURIComponent(school.school_name)}`;
  };

  return (
    <article 
      className={`card horiz ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ 
        cursor: 'pointer',
        border: isSelected ? '2px solid #0F5AA8' : undefined,
        transform: isSelected ? 'translateX(4px)' : undefined,
        transition: 'all 0.2s ease'
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
          {Array.from(new Set(school.departments.map(d => d.academic_group))).slice(0, 4).map((group, idx) => (
            <span key={idx} className={`tag ${['blue', 'lime', 'mint', 'pink'][idx % 4]}`}>
              {group}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default memo(SchoolCard);
