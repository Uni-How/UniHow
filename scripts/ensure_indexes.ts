
const mongoose = require('mongoose');

// Define minimal Schema for indexing
const SchoolSchema = new mongoose.Schema({
  school_id: { type: String, required: true, unique: true },
  school_name: String,
  school_type: String,
  campuses: [{
    location: {
        city: String
    }
  }],
  departments: [{
    academic_group: String,
    admission_data: mongoose.Schema.Types.Mixed
  }],
});

const School = mongoose.models.School || mongoose.model('School', SchoolSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unihow-admission';

async function createIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    console.log('Connected to MongoDB...');
    console.log('Creating Indexes on School collection...');

    // 1. School ID (Core lookup)
    await School.collection.createIndex({ school_id: 1 }, { unique: true });
    console.log('✓ Index created: school_id');

    // 2. Academic Group (Filter)
    await School.collection.createIndex({ "departments.academic_group": 1 });
    console.log('✓ Index created: departments.academic_group');

    // 3. Region/City (Filter)
    await School.collection.createIndex({ "campuses.location.city": 1 });
    console.log('✓ Index created: campuses.location.city');

    // 4. Optimization for Year/Method queries (Compound if possible, or simple)
    // Checking if 114/115 plan exists
    // Note: Deep nested indexing can be large, but useful for 'exists' queries
    // await School.collection.createIndex({ "departments.admission_data.114": 1 }); // Optional

    console.log('All Indexes Verified/Created.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
