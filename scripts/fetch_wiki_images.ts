/**
 * 從 Wikipedia 獲取學校照片的腳本
 * 用於補齊資料庫中缺失的學校圖片
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';

// 需要補齊圖片的學校清單 (使用校園相關的維基百科頁面標題)
const SCHOOLS_NEEDING_IMAGES = [
  { school_id: '005', name: '東吳大學', wiki_title: '東吳大學_(臺灣)', search_term: '東吳大學 校園' },
  { school_id: '011', name: '中山醫學大學', wiki_title: '中山醫學大學', search_term: '中山醫學大學 校門' },
  { school_id: '012', name: '國立陽明交通大學', wiki_title: '國立陽明交通大學', search_term: '陽明交通大學 校門' },
  { school_id: '013', name: '淡江大學', wiki_title: '淡江大學', search_term: '淡江大學 校園' },
  { school_id: '019', name: '輔仁大學', wiki_title: '輔仁大學', search_term: '輔仁大學 校門' },
  { school_id: '034', name: '南臺科技大學', wiki_title: '南臺科技大學', search_term: '南臺科技大學' },
  { school_id: '037', name: '中華大學', wiki_title: '中華大學', search_term: '中華大學 新竹' },
  { school_id: '039', name: '銘傳大學', wiki_title: '銘傳大學', search_term: '銘傳大學 校園' },
  { school_id: '041', name: '實踐大學', wiki_title: '實踐大學', search_term: '實踐大學 校園' },
  { school_id: '044', name: '國立暨南國際大學', wiki_title: '國立暨南國際大學', search_term: '暨南國際大學 校門' },
  { school_id: '046', name: '國立臺灣體育運動大學', wiki_title: '國立臺灣體育運動大學', search_term: '臺灣體育運動大學' },
  { school_id: '057', name: '亞洲大學', wiki_title: '亞洲大學_(臺灣)', search_term: '亞洲大學 臺灣 校園' },
  { school_id: '058', name: '國立宜蘭大學', wiki_title: '國立宜蘭大學', search_term: '國立宜蘭大學 校門' },
  { school_id: '060', name: '馬偕醫學院', wiki_title: '馬偕醫學院', search_term: '馬偕醫學院' },
];

// Wikipedia API 查詢圖片
async function getWikipediaImage(title: string): Promise<string | null> {
  try {
    // 使用 Wikipedia API 的 pageimages 屬性獲取主要圖片
    const apiUrl = `https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'UniHow/1.0 (https://unihow.tw; contact@unihow.tw)',
      },
    });

    if (!response.ok) {
      console.log(`  ❌ Wikipedia API 錯誤: ${response.status} for ${title}`);
      return null;
    }

    const data = await response.json();
    
    if (data.thumbnail?.source) {
      // 嘗試獲取更高解析度的圖片
      let imageUrl = data.thumbnail.source;
      // 將縮圖 URL 轉換為較大尺寸
      imageUrl = imageUrl.replace(/\/\d+px-/, '/960px-');
      return imageUrl;
    }

    if (data.originalimage?.source) {
      return data.originalimage.source;
    }

    console.log(`  ⚠️ 找不到圖片: ${title}`);
    return null;
  } catch (error) {
    console.error(`  ❌ 獲取 ${title} 圖片失敗:`, error);
    return null;
  }
}

// 備用: 使用 Wikimedia Commons API
async function getCommonsImage(searchTerm: string): Promise<string | null> {
  try {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&format=json&srlimit=5`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'UniHow/1.0 (https://unihow.tw; contact@unihow.tw)',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const results = data.query?.search || [];
    
    for (const result of results) {
      const title = result.title;
      // 獲取實際圖片 URL
      const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=960&format=json`;
      
      const infoResponse = await fetch(imageInfoUrl, {
        headers: {
          'User-Agent': 'UniHow/1.0 (https://unihow.tw; contact@unihow.tw)',
        },
      });
      
      if (infoResponse.ok) {
        const infoData = await infoResponse.json();
        const pages = infoData.query?.pages || {};
        const page = Object.values(pages)[0] as any;
        if (page?.imageinfo?.[0]?.thumburl) {
          return page.imageinfo[0].thumburl;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`  ❌ Commons 搜尋失敗:`, error);
    return null;
  }
}

async function main() {
  console.log('🔍 開始從 Wikimedia Commons 獲取學校圖片...\n');
  
  const results: { school_id: string; name: string; imageUrl: string | null; source: string }[] = [];
  
  for (const school of SCHOOLS_NEEDING_IMAGES) {
    console.log(`📸 處理: ${school.name} (${school.school_id})`);
    
    // 優先從 Commons 搜尋校園照片
    let imageUrl = await getCommonsImage(school.search_term);
    let source = 'commons';
    
    // 如果 Commons 沒有，再嘗試 Wikipedia
    if (!imageUrl) {
      console.log(`  🔄 嘗試從 Wikipedia 獲取...`);
      imageUrl = await getWikipediaImage(school.wiki_title);
      source = 'wikipedia';
    }
    
    if (imageUrl) {
      console.log(`  ✅ 找到圖片: ${imageUrl.substring(0, 80)}...`);
    } else {
      console.log(`  ❌ 無法找到圖片`);
    }
    
    results.push({
      school_id: school.school_id,
      name: school.name,
      imageUrl,
      source: imageUrl ? source : 'none',
    });
    
    // 避免過快請求
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 結果摘要:');
  console.log('=' .repeat(60));
  
  const found = results.filter(r => r.imageUrl);
  const notFound = results.filter(r => !r.imageUrl);
  
  console.log(`✅ 找到圖片: ${found.length} 所學校`);
  console.log(`❌ 未找到圖片: ${notFound.length} 所學校`);
  
  if (notFound.length > 0) {
    console.log('\n未找到圖片的學校:');
    notFound.forEach(r => console.log(`  - ${r.name}`));
  }
  
  // 詢問是否更新資料庫
  console.log('\n📝 找到的圖片 URL:');
  found.forEach(r => {
    console.log(`\n${r.name} (${r.school_id}):`);
    console.log(`  ${r.imageUrl}`);
  });
  
  // 更新資料庫
  if (found.length > 0 && process.argv.includes('--update')) {
    console.log('\n🔄 開始更新資料庫...');
    
    if (!MONGODB_URI) {
      console.error('❌ 請設定 MONGODB_URI 環境變數');
      process.exit(1);
    }
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('unihow');
    const collection = db.collection('schools');
    
    for (const result of found) {
      if (result.imageUrl) {
        const updateResult = await collection.updateOne(
          { school_id: result.school_id },
          { $set: { school_images: [result.imageUrl] } }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log(`  ✅ 更新成功: ${result.name}`);
        } else {
          console.log(`  ⚠️ 未更新: ${result.name} (可能資料不存在)`);
        }
      }
    }
    
    await client.close();
    console.log('\n✅ 資料庫更新完成!');
  } else if (found.length > 0) {
    console.log('\n💡 提示: 使用 --update 參數來更新資料庫');
    console.log('   例如: npx ts-node scripts/fetch_wiki_images.ts --update');
  }
}

main().catch(console.error);
