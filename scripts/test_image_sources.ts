

// Use native fetch (available in Node 18+)
// No external dependencies required

interface School {
  school_id: string;
  school_name: string;
  school_url: string;
}

const TEST_SCHOOLS: School[] = [
  { school_id: '001', school_name: '國立臺灣大學', school_url: 'https://www.ntu.edu.tw/' },
  { school_id: '002', school_name: '國立清華大學', school_url: 'https://www.nthu.edu.tw/' },
  { school_id: '003', school_name: '國立成功大學', school_url: 'https://www.ncku.edu.tw/' },
  { school_id: '004', school_name: '國立陽明交通大學', school_url: 'https://www.nycu.edu.tw/' },
  { school_id: '005', school_name: '逢甲大學', school_url: 'https://www.fcu.edu.tw/' }, 
  { school_id: '006', school_name: '淡江大學', school_url: 'https://www.tku.edu.tw/' }
];

async function fetchWikiImage(schoolName: string): Promise<string | null> {
  try {
    // 1. Search for the Wikipedia page
    const searchUrl = `https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(schoolName)}&format=json&utf8=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json() as any;
    
    if (!searchData.query?.search || searchData.query.search.length === 0) {
      console.log(`[Wiki] No page found for ${schoolName}`);
      return null;
    }

    const pageTitle = searchData.query.search[0].title;
    
    // 2. Get the main page image
    const pageUrl = `https://zh.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=1000`;
    const pageRes = await fetch(pageUrl);
    const pageDataResponse = await pageRes.json() as any;
    
    const pages = pageDataResponse.query.pages;
    const pageId = Object.keys(pages)[0];
    const pageData = pages[pageId];

    if (pageData.thumbnail && pageData.thumbnail.source) {
      return pageData.thumbnail.source;
    }
    
    console.log(`[Wiki] Page found for ${schoolName} but no thumbnail available.`);
    return null;

  } catch (error) {
    console.error(`[Wiki] Error fetching for ${schoolName}:`, (error as Error).message);
    return null;
  }
}

async function fetchOgImage(schoolUrl: string): Promise<string | null> {
  try {
    // Set a User-Agent to mimic a browser/bot so we don't get 403ed
    const res = await fetch(schoolUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(5000) // 5 seconds timeout
    });

    if (!res.ok) {
        console.log(`[OG] Failed to fetch ${schoolUrl}: ${res.status} ${res.statusText}`);
        return null;
    }

    const html = await res.text();
    
    // Simple Regex to find og:image
    // Looks for <meta property="og:image" content="..."> or <meta content="..." property="og:image">
    const ogImageRegex = /<meta\s+(?:[^>]*?\s+)?property=["']og:image["']\s+(?:[^>]*?\s+)?content=["']([^"']+)["']|<meta\s+(?:[^>]*?\s+)?content=["']([^"']+)["']\s+(?:[^>]*?\s+)?property=["']og:image["']/i;
    
    const match = html.match(ogImageRegex);
    let ogImage = match ? (match[1] || match[2]) : null;

    if (ogImage) {
      // Decode HTML entities if necessary (basic check)
        ogImage = ogImage.replace(/&amp;/g, '&');

      // Handle relative URLs
      if (ogImage.startsWith('http')) {
        return ogImage;
      } else {
         try {
             // Construct absolute URL
             const baseUrl = new URL(schoolUrl);
             return new URL(ogImage, baseUrl.origin).toString();
         } catch (e) {
             return null;
         }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`[OG] Error fetching for ${schoolUrl}:`, (error as Error).message);
    return null;
  }
}

async function runTest() {
  console.log('Starting Image Source Feasibility Test (Native Fetch)...\n');
  const results = [];

  for (const school of TEST_SCHOOLS) {
    console.log(`Processing: ${school.school_name}...`);
    
    // Test Wiki
    const wikiImage = await fetchWikiImage(school.school_name);
    
    // Test OG
    const ogImage = await fetchOgImage(school.school_url);
    
    results.push({
      name: school.school_name,
      wiki: wikiImage,
      og: ogImage
    });
    
    console.log(`  -> Wiki: ${wikiImage ? 'FOUND' : 'MISSING'}`);
    console.log(`  -> OG:   ${ogImage ? 'FOUND' : 'MISSING'}`);
    console.log('-------------------------------------------');
  }

  console.log('\nFinal Results:', JSON.stringify(results, null, 2));
}

runTest();

