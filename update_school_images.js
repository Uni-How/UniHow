const mongoose = require('mongoose');

// 连接到MongoDB - 使用正确的连接URI
const mongoUri = 'mongodb+srv://Admin:qvA3AbXgp73eGv3R@unihow-mongodb.5slri5j.mongodb.net/admission_db?appName=unihow-mongodb&retryWrites=true&w=majority';

async function updateImages() {
  try {
    // 连接
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });
    
    const db = mongoose.connection.db;
    const schools = db.collection('schools');
    
    // 第一个URL - 嘉義大學
    const url1 = 'https://images.1111.com.tw/discussPic/13/47735613_145030368.133016.jpg';
    const result1 = await schools.updateOne(
      { school_name: '嘉義大學' },
      { $push: { school_images: url1 } }
    );
    console.log('嘉義大學 更新结果:', result1);
    
    // 第二个URL - 中國醫藥大學
    const url2 = 'https://s4.itho.me/sites/default/files/styles/picture_size_large/public/zhong_guo_yi_yao_da_xue_shui_nan_zhi_hui_xiao_qu_.jpg?itok=TQM6_uX8';
    const result2 = await schools.updateOne(
      { school_name: '中國醫藥大學' },
      { $push: { school_images: url2 } }
    );
    console.log('中國醫藥大學 更新结果:', result2);
    
    // 查询更新后的数据
    console.log('\n更新后的嘉義大學:');
    const updated1 = await schools.findOne({ school_name: '嘉義大學' }, { projection: { school_images: 1, school_name: 1 } });
    console.log(JSON.stringify(updated1, null, 2));
    
    console.log('\n更新后的中國醫藥大學:');
    const updated2 = await schools.findOne({ school_name: '中國醫藥大學' }, { projection: { school_images: 1, school_name: 1 } });
    console.log(JSON.stringify(updated2, null, 2));
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

updateImages();
