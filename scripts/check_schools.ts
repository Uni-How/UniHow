import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

config({ path: '.env.local' });

async function run() {
  const c = new MongoClient(process.env.MONGODB_URI2!);
  await c.connect();
  
  const schools = ['東吳大學', '中山醫學大學', '國立陽明交通大學', '淡江大學', '輔仁大學', 
                   '南臺科技大學', '中華大學', '銘傳大學', '實踐大學', '國立暨南國際大學',
                   '國立臺灣體育運動大學', '亞洲大學', '國立宜蘭大學', '馬偕醫學院'];
  
  const results = await c.db('admission_db').collection('schools')
    .find({ school_name: { $in: schools } }, { projection: { school_id: 1, school_name: 1, school_images: 1 } })
    .toArray();
  
  console.log('找到的學校:');
  results.forEach(r => {
    const hasImage = r.school_images && r.school_images.length > 0 && !r.school_images[0].includes('placeholder');
    console.log(`  ${r.school_id}: ${r.school_name} - ${hasImage ? '✅ 有圖' : '❌ 需更新'}`);
  });
  
  await c.close();
}

run();
