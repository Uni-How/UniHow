// @ts-nocheck
/**
 * MongoDB 索引設置腳本
 * 用於優化查詢效能
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

async function setupIndexes() {
  console.log('🔧 開始設置 MongoDB 索引...\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ 已連接到 MongoDB\n');

    const db = client.db();
    const schoolsCollection = db.collection('schools');

    // 1. school_id 唯一索引（主鍵）
    console.log('📌 建立 school_id 唯一索引...');
    await schoolsCollection.createIndex(
      { school_id: 1 },
      { unique: true, name: 'idx_school_id' }
    );
    console.log('   ✓ school_id 索引已建立\n');

    // 2. school_type 索引（公立/私立篩選）
    console.log('📌 建立 school_type 索引...');
    await schoolsCollection.createIndex(
      { school_type: 1 },
      { name: 'idx_school_type' }
    );
    console.log('   ✓ school_type 索引已建立\n');

    // 3. 主校區城市複合索引（地區篩選）
    console.log('📌 建立主校區城市索引...');
    await schoolsCollection.createIndex(
      { 'campuses.is_main': 1, 'campuses.location.city': 1 },
      { name: 'idx_main_campus_city' }
    );
    console.log('   ✓ 主校區城市索引已建立\n');

    // 4. 學群索引（學群篩選）
    console.log('📌 建立學群索引...');
    await schoolsCollection.createIndex(
      { 'departments.academic_group': 1 },
      { name: 'idx_academic_group' }
    );
    console.log('   ✓ 學群索引已建立\n');

    // 5. 學院索引
    console.log('📌 建立學院索引...');
    await schoolsCollection.createIndex(
      { 'departments.college': 1 },
      { name: 'idx_college' }
    );
    console.log('   ✓ 學院索引已建立\n');

    // 顯示所有索引
    console.log('📋 當前所有索引：');
    const indexes = await schoolsCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ 所有索引設置完成！');

  } catch (error) {
    console.error('❌ 索引設置失敗：', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 已關閉 MongoDB 連線');
  }
}

// 執行腳本
setupIndexes()
  .then(() => {
    console.log('\n🎉 索引設置腳本執行成功！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 索引設置腳本執行失敗：', error);
    process.exit(1);
  });
