const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI2;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI2 is not defined in .env.local');
  process.exit(1);
}

// Inline Schema Definition to avoid TS/Model loading issues
const Schema = mongoose.Schema;

// --- Sub-schemas ---
const ExamThresholdSchema = new Schema({
  subject: { type: String, required: true },
  exam_type: { type: String, required: true },
  threshold: { type: String, required: true }
}, { _id: false });

const SelectionMultiplierSchema = new Schema({
  subject: { type: String, required: true },
  multiplier: { type: Number, default: null }, // Can be null
  order: { type: Number, required: false }
}, { _id: false });

const ScoringWeightSchema = new Schema({
  subject: { type: String, required: true },
  source_type: { type: String, required: false }, // Made optional as sometimes missing
  multiplier: { type: Number, default: 1 }, // Default to 1 if missing
  order: { type: Number, required: false }
}, { _id: false });

const PassingDataSchema = new Schema({
    subject: String,
    grade: Number,
    note: String
}, { _id: false });

const LastYearPassDataSchema = new Schema({
    academic_year: Number,
    passing_sequence: [PassingDataSchema]
}, { _id: false });

// Star Plan Ranking
const RankingCriterionSchema = new Schema({
    item: { type: String, required: true },
    order: { type: Number, required: true } // Changed from percentile to order
}, { _id: false });

// Plans
const PersonalApplicationSchema = new Schema({
  quota: { type: Number, default: 0 },
  exam_thresholds: [ExamThresholdSchema],
  selection_multipliers: [SelectionMultiplierSchema],
  english_listening_threshold: { type: String, default: null },
  last_year_pass_data: { type: LastYearPassDataSchema, default: null }
}, { _id: false });

const DistributionAdmissionSchema = new Schema({
    quota: { type: Number, default: 0 },
    exam_thresholds: [ExamThresholdSchema],
    english_listening_threshold: { type: String, default: null },
    scoring_weights: [ScoringWeightSchema],
    art_test_category: { type: String, default: null },
    tie_breakers: [{ type: String }], 
    last_year_pass_data: { type: LastYearPassDataSchema, default: null }
}, { _id: false });

const StarPlanSchema = new Schema({
    quota: { type: Number, default: 0 },
    exam_thresholds: [ExamThresholdSchema],
    ranking_criteria: [RankingCriterionSchema],
    last_year_pass_data: { type: LastYearPassDataSchema, default: null }
}, { _id: false });

const PlansSchema = new Schema({
    personal_application: { type: PersonalApplicationSchema, required: false },
    distribution_admission: { type: DistributionAdmissionSchema, required: false },
    star_plan: { type: StarPlanSchema, required: false }
}, { _id: false });

// Admission Data Structure
// admission_data: { "114": { plans: ... }, "115": { plans: ... } }
// Since keys are dynamic numbers, using Map or strict object if keys are known.
// But standard.json implies object.
// We can use a Map or a Mixed type, but to enforce schema we can try:
const AdmissionYearSchema = new Schema({
    plans: { type: PlansSchema, required: true }
}, { _id: false });

const DepartmentSchema = new Schema({
  department_id: { type: String, required: true },
  department_name: { type: String, required: true },
  college: { type: String, required: true },
  academic_group: { type: String, required: true },
  campus_ids: [{ type: String }],
  department_description: { type: String, default: '' },
  years_of_study: { type: Number, required: true },
  
  // The new nested field
  admission_data: {
      "114": { type: AdmissionYearSchema, required: false },
      "115": { type: AdmissionYearSchema, required: false },
      "113": { type: AdmissionYearSchema, required: false }
  }
}, { _id: false });

const CampusSchema = new Schema({
  campus_id: { type: String, required: true },
  campus_name: { type: String, required: true },
  is_main: { type: Boolean, required: true },
  location: {
    city: { type: String, required: true },
    district: { type: String, required: true },
    address: { type: String, required: true },
    google_map_url: String 
  }
}, { _id: false });

const SchoolSchema = new Schema({
  school_id: { type: String, required: true, unique: true },
  school_name: { type: String, required: true },
  school_type: { type: String, required: true },
  school_images: [String],
  school_url: String,
  campuses: [CampusSchema],
  departments: [DepartmentSchema]
}, { timestamps: true });

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create Model
    // Check if model exists
    const SchoolModel = mongoose.models.School || mongoose.model('School', SchoolSchema);

    // Read Data
    const filePath = path.join(__dirname, '../資料JSON檔/data_structured_final_1211.json');
    if (!fs.existsSync(filePath)) {
        throw new Error('Data file not found at: ' + filePath);
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    const schools = data.schools || (Array.isArray(data) ? data : []);

    if (schools.length === 0) {
        throw new Error('No schools to import.');
    }

    console.log(`Found ${schools.length} schools to import.`);

    // Clear
    await SchoolModel.deleteMany({});
    console.log('Cleared existing School data.');

    // Insert
    const result = await SchoolModel.insertMany(schools);
    console.log(`Successfully inserted ${result.length} schools.`);

    // Count Metadata
    const totalDepts = schools.reduce((acc, s) => acc + (s.departments?.length || 0), 0);
    console.log(`Total Departments Inserted: ${totalDepts}`);

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);

  } catch (error) {
    console.error('Seed error:', error);
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    process.exit(1);
  }
}

seed();
