import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import dbConnect from "@/lib/mongodb";

/**
 * 資料庫初始化/重置 API 端點
 * POST /api/db-seed
 * 
 * 將 JSON 檔案中的資料匯入到 MongoDB
 * 需要管理員權限或測試環境
 */

const JSON_CONFIG_PATH = path.join(
  process.cwd(),
  "JSON",
  "configs"
);

interface SeedRequest {
  collections?: string[];  // 指定要初始化的 collections
  clear_first?: boolean;    // 是否先清空現有資料
}

export async function POST(request: NextRequest) {
  try {
    // 只允許在開發環境或有效的密鑰
    const auth_key = request.headers.get("X-Admin-Key");
    if (process.env.NODE_ENV === "production" && auth_key !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body: SeedRequest = await request.json();
    const { collections, clear_first = false } = body;

    const db = await dbConnect();

    const seed_results: any = {};

    // 資料對應表
    const collection_mappings: { [key: string]: { file: string; collection: string } } = {
      "assessment_standards_113": {
        file: "assessment_standards_113.json",
        collection: "assessment_standards"
      },
      "assessment_standards_114": {
        file: "assessment_standards_114.json",
        collection: "assessment_standards"
      },
      "bifurcated_standards_113": {
        file: "bifurcated_standards_113.json",
        collection: "bifurcated_standards"
      },
      "bifurcated_standards_114": {
        file: "bifurcated_standards_114.json",
        collection: "bifurcated_standards"
      },
      "score_conversion_113": {
        file: "score_conversion_113.json",
        collection: "score_conversions"
      },
      "score_conversion_114": {
        file: "score_conversion_114.json",
        collection: "score_conversions"
      }
    };

    // 決定要初始化的資料
    const to_seed = collections && collections.length > 0
      ? collections
      : Object.keys(collection_mappings);

    for (const seed_key of to_seed) {
      try {
        const mapping = collection_mappings[seed_key];

        if (!mapping) {
          seed_results[seed_key] = {
            status: "error",
            message: `Unknown seed key: ${seed_key}`
          };
          continue;
        }

        const file_path = path.join(JSON_CONFIG_PATH, mapping.file);

        // 檢查檔案是否存在
        if (!fs.existsSync(file_path)) {
          seed_results[seed_key] = {
            status: "error",
            message: `File not found: ${file_path}`
          };
          continue;
        }

        // 讀取 JSON 檔案
        const file_content = fs.readFileSync(file_path, "utf-8");
        const data = JSON.parse(file_content);

        const collection = db.collection(mapping.collection);

        // 如果需要清空現有資料
        if (clear_first && seed_key.endsWith("_113")) {
          await collection.deleteMany({});
        }

        // 檢查該文件的年份資料是否已存在
        const academic_year = data.academic_year;
        const existing = await collection.findOne({ academic_year });

        if (existing) {
          // 更新現有資料
          const result = await collection.updateOne(
            { academic_year },
            { $set: data }
          );

          seed_results[seed_key] = {
            status: "success",
            action: "updated",
            matched: result.matchedCount,
            modified: result.modifiedCount,
            file: mapping.file
          };
        } else {
          // 插入新資料
          const result = await collection.insertOne(data);

          seed_results[seed_key] = {
            status: "success",
            action: "inserted",
            inserted_id: result.insertedId,
            file: mapping.file
          };
        }
      } catch (error: any) {
        seed_results[seed_key] = {
          status: "error",
          message: error.message
        };
      }
    }

    // 驗證最終狀態
    const health_check: any = {};
    for (const collection_name of [
      "assessment_standards",
      "bifurcated_standards",
      "score_conversions"
    ]) {
      const collection = db.collection(collection_name);
      const count = await collection.countDocuments();
      health_check[collection_name] = {
        document_count: count,
        ready: count > 0
      };
    }

    return NextResponse.json(
      {
        success: true,
        seed_results,
        health_check,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Database seed error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/db-seed",
    method: "POST",
    description: "Initialize/reset database with JSON configuration files",
    headers: {
      "X-Admin-Key": "Your admin key (production only)",
      "Content-Type": "application/json"
    },
    request_body: {
      collections: "array of seed keys to initialize (optional)",
      clear_first: "boolean to clear existing data first (optional)"
    },
    example_request: {
      collections: [
        "assessment_standards_113",
        "assessment_standards_114",
        "bifurcated_standards_113",
        "bifurcated_standards_114",
        "score_conversion_113",
        "score_conversion_114"
      ],
      clear_first: false
    },
    available_seeds: [
      "assessment_standards_113",
      "assessment_standards_114",
      "bifurcated_standards_113",
      "bifurcated_standards_114",
      "score_conversion_113",
      "score_conversion_114"
    ]
  });
}
