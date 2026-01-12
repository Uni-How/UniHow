import dbConnect from '@/lib/mongodb';
import School from '@/models/School';

async function updateImages() {
  try {
    await dbConnect();
    
    // 第一个URL - 嘉義大學
    const url1 = 'https://images.1111.com.tw/discussPic/13/47735613_145030368.133016.jpg';
    const result1 = await School.updateOne(
      { school_name: '嘉義大學' },
      { $push: { school_images: url1 } }
    );
    console.log('嘉義大學 更新结果:', result1.modifiedCount, '条记录被修改');
    
    // 第二个URL - 中國醫藥大學
    const url2 = 'https://s4.itho.me/sites/default/files/styles/picture_size_large/public/zhong_guo_yi_yao_da_xue_shui_nan_zhi_hui_xiao_qu_.jpg?itok=TQM6_uX8';
    const result2 = await School.updateOne(
      { school_name: '中國醫藥大學' },
      { $push: { school_images: url2 } }
    );
    console.log('中國醫藥大學 更新结果:', result2.modifiedCount, '条记录被修改');
    
    // 查询更新后的数据
    console.log('\n更新后的嘉義大學:');
    const updated1 = await School.findOne({ school_name: '嘉義大學' }).select('school_images school_name');
    console.log(JSON.stringify(updated1, null, 2));
    
    console.log('\n更新后的中國醫藥大學:');
    const updated2 = await School.findOne({ school_name: '中國醫藥大學' }).select('school_images school_name');
    console.log(JSON.stringify(updated2, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

updateImages();
