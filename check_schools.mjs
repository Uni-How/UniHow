import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://Admin:qvA3AbXgp73eGv3R@unihow-mongodb.5slri5j.mongodb.net/admission_db?appName=unihow-mongodb&retryWrites=true&w=majority';
const client = new MongoClient(uri);

async function checkSchools() {
  try {
    await client.connect();
    const db = client.db('admission_db');
    const schools = db.collection('schools');
    
    // 查找嘉義大學
    const school1 = await schools.findOne({ school_name: { $regex: '嘉義', $options: 'i' } }, { projection: { school_name: 1, school_id: 1 } });
    console.log('嘉義大學:', school1);
    
    // 查找中國醫藥大學
    const school2 = await schools.findOne({ school_name: { $regex: '中國醫藥', $options: 'i' } }, { projection: { school_name: 1, school_id: 1 } });
    console.log('中國醫藥大學:', school2);
    
  } finally {
    await client.close();
  }
}

checkSchools().catch(console.error);
