import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

config({ path: '.env.local' });

async function run() {
  const c = new MongoClient(process.env.MONGODB_URI2!);
  await c.connect();
  
  // 查找南臺科技大學
  const stut = await c.db('admission_db').collection('schools')
    .findOne({ school_name: { $regex: '南臺' } }, { projection: { school_id: 1, school_name: 1 } });
  console.log('南臺科技大學:', stut);
  
  // 查找中山醫學大學
  const csmu = await c.db('admission_db').collection('schools')
    .findOne({ school_name: { $regex: '中山醫' } }, { projection: { school_id: 1, school_name: 1 } });
  console.log('中山醫學大學:', csmu);
  
  await c.close();
}

run();
