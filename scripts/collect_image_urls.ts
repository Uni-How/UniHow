
import fs from 'fs';
import path from 'path';
import schoolsData from '../資料JSON檔/data_structured_final_1216.json';

// Use native fetch (Node 18+)

const MAPPING_FILE = path.join(process.cwd(), 'data', 'url_mapping.json');

// Interface for School Data
interface SchoolData {
  school_id: string;
  school_name: string;
  school_url: string;
}

// Helper: Sanitize URL
function sanitizeUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).toString();
  } catch (e) {
    return null;
  }
}

// Helper: Search Wikipedia (Primary Strategy for Hotlinking)
async function fetchWikiIdentifier(schoolName: string): Promise<string | null> {
  try {
    // 1. Search for Page
    const searchUrl = `https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(schoolName)}&format=json&utf8=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json() as any;
    
    if (!searchData.query?.search || searchData.query.search.length === 0) {
      return null;
    }

    const pageTitle = searchData.query.search[0].title;

    // 2. Get Image URL
    // pithumbsize=1000 gives us a nice large URL, usually hosted on upload.wikimedia.org which allows hotlinking
    const pageUrl = `https://zh.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=800`;
    const pageRes = await fetch(pageUrl);
    const pageDataResponse = await pageRes.json() as any;
    
    const pages = pageDataResponse.query.pages;
    const pageId = Object.keys(pages)[0];
    const pageData = pages[pageId];

    if (pageData.thumbnail && pageData.thumbnail.source) {
      return pageData.thumbnail.source;
    }
    return null;
  } catch (error) {
    console.error(`  [Wiki Error] ${schoolName}: ${(error as Error).message}`);
    return null;
  }
}

// Helper: Fetch OG Image (Secondary Strategy - Risk of 403)
async function fetchOgImage(schoolUrl: string): Promise<string | null> {
  try {
    const res = await fetch(schoolUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) return null;

    const html = await res.text();
    const ogImageRegex = /<meta\s+(?:[^>]*?\s+)?property=["']og:image["']\s+(?:[^>]*?\s+)?content=["']([^"']+)["']|<meta\s+(?:[^>]*?\s+)?content=["']([^"']+)["']\s+(?:[^>]*?\s+)?property=["']og:image["']/i;
    const match = html.match(ogImageRegex);
    let ogImage = match ? (match[1] || match[2]) : null;

    if (ogImage) {
      ogImage = ogImage.replace(/&amp;/g, '&');
      if (ogImage.startsWith('http')) {
        return ogImage;
      } else {
         try {
             return new URL(ogImage, new URL(schoolUrl).origin).toString();
         } catch (e) {
             return null;
         }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function checkUrlAvailability(url: string): Promise<boolean> {
    try {
        const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
        return res.ok;
    } catch {
        return false;
    }
}

async function main() {
  console.log('🚀 Starting Remote URL Collector...');
  
  const schools = schoolsData.schools;
  const mapping: Record<string, string> = {};
  
  if (!fs.existsSync(path.dirname(MAPPING_FILE))) {
      fs.mkdirSync(path.dirname(MAPPING_FILE), { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;

  for (const school of schools) {
    const schoolId = school.school_id;
    const schoolName = school.school_name;
    const schoolUrl = sanitizeUrl(school.school_url);
    
    console.log(`🔄 Processing: ${schoolName} (${schoolId})...`);
    
    let imageUrl: string | null = null;
    let source = '';

    // Priority 1: Wikipedia (Best for Hotlinking)
    imageUrl = await fetchWikiIdentifier(schoolName);
    if (imageUrl) {
        source = 'Wikipedia';
    } else {
        // Retry Wiki with shorter name
        if (schoolName.includes('國立') || schoolName.includes('私立')) {
            const shortName = schoolName.replace(/國立|私立/g, '');
            imageUrl = await fetchWikiIdentifier(shortName);
            if (imageUrl) source = 'Wikipedia (Short)';
        }
    }

    // Priority 2: OG Image (If Wiki fails)
    if (!imageUrl && schoolUrl) {
        imageUrl = await fetchOgImage(schoolUrl);
        // Verify if we can access it (basic header check to avoid putting dead links)
        if (imageUrl) {
            const isAccessible = await checkUrlAvailability(imageUrl);
            if (isAccessible) {
                source = 'OG Tag';
            } else {
                console.log(`  ⚠️ [OG Blocked] Found URL but 403/Error: ${imageUrl}`);
                imageUrl = null;
            }
        }
    }

    if (imageUrl) {
        console.log(`✅ [Success] ${schoolName} -> ${source} (${imageUrl.substring(0, 40)}...)`);
        mapping[schoolId] = imageUrl;
        successCount++;
    } else {
        console.log(`⚠️ [Not Found] ${schoolName}`);
        failCount++;
    }
  }

  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
  
  console.log('\n--- Summary ---');
  console.log(`Total: ${schools.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Mapping saved to: ${MAPPING_FILE}`);
}

main().catch(err => console.error(err));
