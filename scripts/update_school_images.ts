/**
 * 更新學校圖片的腳本
 * 從 Wikipedia API 抓取學校圖片並更新資料庫
 */

import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

// 載入 .env.local 環境變數
config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || '';

// 已有直接 URL 的學校清單 (使用正確的 school_id)
const SCHOOLS_WITH_DIRECT_URL: { school_id: string; name: string; imageUrl: string }[] = [
  { school_id: '005', name: '東吳大學', imageUrl: 'https://www.overseas.edu.tw/wp-content/uploads/2023/10/%E7%B2%BE%E9%81%B8%E5%9C%96%E7%89%87-%E5%AD%B8%E6%A0%A1%E7%85%A7%E7%89%87-1-scaled-1-scaled.jpg' },
  { school_id: '010', name: '國立清華大學', imageUrl: 'https://www.nthu.edu.tw/images/hnMain_176249848717.jpg' },
  { school_id: '023', name: '中山醫學大學', imageUrl: 'https://www.csmu.edu.tw/var/file/0/1000/img/1276/378236878.jpg' },
  { school_id: '012', name: '國立陽明交通大學', imageUrl: 'https://images.storm.mg/gallery/321343/20210131-041748_U13380_M670215_9487.jpg' },
  { school_id: '013', name: '淡江大學', imageUrl: 'https://cmn-hant.overseas.ncnu.edu.tw/wp-content/uploads/2022/09/tku.webp' },
  { school_id: '019', name: '輔仁大學', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Cardinal_Yu_Pin_Administration_Building_20250822.jpg' },
  // 南臺科技大學 (034) 不在資料庫中，跳過
  { school_id: '037', name: '中華大學', imageUrl: 'https://cmn-hant.overseas.ncnu.edu.tw/wp-content/uploads/2022/09/chu.webp' },
  { school_id: '039', name: '銘傳大學', imageUrl: 'https://www.overseas.edu.tw/wp-content/uploads/2020/10/%E6%A1%83%E5%9C%92%E9%8A%98%E5%9C%92-scaled-1-scaled.jpg' },
  { school_id: '041', name: '實踐大學', imageUrl: 'https://www.unews.com.tw/upload/news/2213_1.jpg?v=1' },
  { school_id: '044', name: '國立暨南國際大學', imageUrl: 'https://www.overseas.edu.tw/wp-content/uploads/2025/10/NCNU.png' },
  { school_id: '046', name: '國立臺灣體育運動大學', imageUrl: 'https://www.overseas.edu.tw/wp-content/uploads/2020/10/%E5%9C%8B%E7%AB%8B%E8%87%BA%E7%81%A3%E9%AB%94%E8%82%B2%E9%81%8B%E5%8B%95%E5%A4%A7%E5%AD%B86-2.jpg' },
  { school_id: '057', name: '亞洲大學', imageUrl: 'https://www.asia.edu.tw/var/file/0/1000/img/27/yardintro2.jpg' },
  { school_id: '058', name: '國立宜蘭大學', imageUrl: 'https://www.niu.edu.tw/var/file/0/1000/img/275/691634649.png' },
  { school_id: '060', name: '馬偕醫學院', imageUrl: 'https://uc.udn.com.tw/photo/2025/03/20/98/31689567.jpg' },
];

// 需要從 Wikipedia 搜尋圖片的學校清單（目前已全部有直接 URL）
const SCHOOLS_NEEDING_IMAGES: { school_id: string; name: string; wiki_title: string; en_wiki_title?: string; commons_search?: string }[] = [];

// 圖片排除關鍵字（避免抓到 Logo、圖標等）
const EXCLUDE_KEYWORDS = ['logo', 'icon', 'seal', 'emblem', 'badge', 'symbol', '.svg', '.pdf'];

/**
 * 從 Wikipedia API 獲取頁面主圖
 */
async function getWikipediaImage(title: string, lang: string = 'zh'): Promise<string | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // 優先使用 originalimage (高解析度)
    if (data.originalimage?.source) {
      const src = data.originalimage.source.toLowerCase();
      if (!EXCLUDE_KEYWORDS.some(kw => src.includes(kw))) {
        return data.originalimage.source;
      }
    }
    
    // 備選: thumbnail
    if (data.thumbnail?.source) {
      const src = data.thumbnail.source.toLowerCase();
      if (!EXCLUDE_KEYWORDS.some(kw => src.includes(kw))) {
        // 嘗試獲取更高解析度的版本
        return data.thumbnail.source.replace(/\/\d+px-/, '/960px-');
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 從 Wikipedia 頁面抓取其他圖片（如果主圖不可用）
 */
async function getWikipediaPageImages(title: string): Promise<string | null> {
  const url = `https://zh.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&format=json&imlimit=20`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    
    const pageId = Object.keys(pages)[0];
    const images = pages[pageId]?.images || [];
    
    // 過濾出可能是校園照片的圖片
    const validImages = images.filter((img: any) => {
      const title = img.title.toLowerCase();
      // 排除常見的非照片檔案
      if (EXCLUDE_KEYWORDS.some(kw => title.includes(kw))) return false;
      if (title.includes('commons-logo')) return false;
      if (title.includes('wikidata')) return false;
      // 只接受常見圖片格式
      return title.endsWith('.jpg') || title.endsWith('.jpeg') || title.endsWith('.png');
    });
    
    if (validImages.length === 0) return null;
    
    // 獲取第一張有效圖片的 URL
    const imageName = validImages[0].title.replace('File:', '');
    return await getImageUrl(imageName);
  } catch (error) {
    return null;
  }
}

/**
 * 獲取 Wikimedia 圖片的實際 URL
 */
async function getImageUrl(imageName: string): Promise<string | null> {
  const url = `https://zh.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(imageName)}&prop=imageinfo&iiprop=url&format=json`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    
    const pageId = Object.keys(pages)[0];
    const imageInfo = pages[pageId]?.imageinfo?.[0];
    
    return imageInfo?.url || null;
  } catch (error) {
    return null;
  }
}

// 收集所有學校圖片
const SCHOOL_IMAGES: { school_id: string; name: string; imageUrl: string }[] = [];

/**
 * 從 Wikimedia Commons 搜尋圖片
 */
async function searchCommonsImage(searchTerm: string): Promise<string | null> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&format=json&srlimit=5`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const results = data.query?.search || [];
    
    // 過濾結果，找到可能是校園照片的
    for (const result of results) {
      const title = result.title.toLowerCase();
      // 排除不適合的檔案
      if (EXCLUDE_KEYWORDS.some(kw => title.includes(kw))) continue;
      if (!title.endsWith('.jpg') && !title.endsWith('.jpeg') && !title.endsWith('.png')) continue;
      
      // 取得圖片 URL
      const imageName = result.title.replace('File:', '');
      const imageUrl = await getCommonsImageUrl(imageName);
      if (imageUrl) return imageUrl;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 獲取 Wikimedia Commons 圖片的實際 URL
 */
async function getCommonsImageUrl(imageName: string): Promise<string | null> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(imageName)}&prop=imageinfo&iiprop=url&format=json`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    
    const pageId = Object.keys(pages)[0];
    const imageInfo = pages[pageId]?.imageinfo?.[0];
    
    return imageInfo?.url || null;
  } catch (error) {
    return null;
  }
}

async function fetchAllImages() {
  console.log('🔍 處理學校圖片...\n');
  
  // 先加入已有直接 URL 的學校
  console.log('📦 使用已提供的圖片 URL:');
  for (const school of SCHOOLS_WITH_DIRECT_URL) {
    SCHOOL_IMAGES.push(school);
    console.log(`  ✅ ${school.name}`);
  }
  
  console.log('\n🔍 從 Wikipedia 搜尋剩餘學校圖片:');
  
  for (const school of SCHOOLS_NEEDING_IMAGES) {
    process.stdout.write(`📸 處理: ${school.name} (${school.school_id}) `);
    
    // 先嘗試獲取中文維基頁面主圖
    let imageUrl = await getWikipediaImage(school.wiki_title);
    
    // 如果主圖不可用，嘗試從頁面圖片列表中獲取
    if (!imageUrl) {
      imageUrl = await getWikipediaPageImages(school.wiki_title);
    }
    
    // 如果中文維基沒找到，嘗試英文維基
    if (!imageUrl && school.en_wiki_title) {
      imageUrl = await getWikipediaImage(school.en_wiki_title, 'en');
    }
    
    // 如果還是沒找到，嘗試 Commons 搜尋
    if (!imageUrl && school.commons_search) {
      imageUrl = await searchCommonsImage(school.commons_search);
    }
    
    if (imageUrl) {
      SCHOOL_IMAGES.push({
        school_id: school.school_id,
        name: school.name,
        imageUrl
      });
      console.log('✅ 找到圖片');
    } else {
      console.log('❌ 未找到圖片');
    }
    
    // 避免請求過快
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

async function main() {
  // 先獲取所有圖片
  await fetchAllImages();
  
  const totalSchools = SCHOOLS_WITH_DIRECT_URL.length + SCHOOLS_NEEDING_IMAGES.length;
  console.log(`\n📊 結果: 找到 ${SCHOOL_IMAGES.length}/${totalSchools} 所學校的圖片\n`);
  
  if (SCHOOL_IMAGES.length === 0) {
    console.log('❌ 沒有找到任何圖片');
    return;
  }
  
  // 顯示找到的圖片
  console.log('📝 找到的圖片:');
  SCHOOL_IMAGES.forEach(img => {
    console.log(`  - ${img.name}: ${img.imageUrl.substring(0, 80)}...`);
  });
  
  // 更新資料庫
  if (process.argv.includes('--update')) {
    console.log('\n🔄 開始更新資料庫...');
    
    if (!MONGODB_URI) {
      console.error('❌ 請設定 MONGODB_URI 環境變數');
      process.exit(1);
    }
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('admission_db');
    const collection = db.collection('schools');
    
    let successCount = 0;
    for (const school of SCHOOL_IMAGES) {
      const updateResult = await collection.updateOne(
        { school_id: school.school_id },
        { $set: { school_images: [school.imageUrl] } }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log(`  ✅ 更新成功: ${school.name}`);
        successCount++;
      } else if (updateResult.matchedCount > 0) {
        console.log(`  ⏭️ 已是最新: ${school.name}`);
      } else {
        console.log(`  ⚠️ 找不到: ${school.name} (school_id: ${school.school_id})`);
      }
    }
    
    await client.close();
    console.log(`\n✅ 資料庫更新完成! 成功更新 ${successCount} 所學校`);
  } else {
    console.log('\n💡 提示: 使用 --update 參數來更新資料庫');
    console.log('   例如: npx ts-node scripts/update_school_images.ts --update');
  }
}

main().catch(console.error);
