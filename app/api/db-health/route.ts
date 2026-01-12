import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

/**
 * 資料庫健康檢查 API 端點
 * GET /api/db-health
 * 
 * 檢查資料庫連接和數據完整性
 */

export async function GET(request: NextRequest) {
  try {
    const db = await dbConnect();

    // 檢查所有必要的 collections
    const required_collections = [
      "assessment_standards",
      "bifurcated_standards",
      "score_conversions",
      "departments"
    ];

    const collection_status: any = {};

    for (const coll_name of required_collections) {
      try {
        const collection = db.collection(coll_name);
        const count = await collection.countDocuments();
        const sample = await collection.findOne();

        collection_status[coll_name] = {
          exists: true,
          document_count: count,
          has_data: !!sample
        };
      } catch (error: any) {
        collection_status[coll_name] = {
          exists: false,
          error: error.message
        };
      }
    }

    // 檢查五標資料完整性
    const assessment_coll = db.collection("assessment_standards");
    const bifurcated_coll = db.collection("bifurcated_standards");

    const gsat_years = await assessment_coll
      .distinct("academic_year")
      .catch(() => []);
    const bifurcated_years = await bifurcated_coll
      .distinct("academic_year")
      .catch(() => []);

    // 檢查級分轉換表
    const conversion_coll = db.collection("score_conversions");
    const conversion_years = await conversion_coll
      .distinct("academic_year")
      .catch(() => []);

    const health_status = {
      database_connected: true,
      collections: collection_status,
      data_completeness: {
        gsat_standards: {
          available_years: gsat_years.sort(),
          complete: gsat_years.includes(113) && gsat_years.includes(114)
        },
        bifurcated_standards: {
          available_years: bifurcated_years.sort(),
          complete: bifurcated_years.includes(113) && bifurcated_years.includes(114)
        },
        score_conversions: {
          available_years: conversion_years.sort(),
          complete: conversion_years.includes(113) && conversion_years.includes(114)
        }
      },
      timestamp: new Date().toISOString()
    };

    const all_complete =
      health_status.data_completeness.gsat_standards.complete &&
      health_status.data_completeness.bifurcated_standards.complete &&
      health_status.data_completeness.score_conversions.complete;

    return NextResponse.json(
      {
        status: all_complete ? "healthy" : "degraded",
        details: health_status
      },
      { status: all_complete ? 200 : 206 }
    );
  } catch (error: any) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
