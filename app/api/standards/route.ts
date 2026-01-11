import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

/**
 * 五標資料 API 端點
 * GET /api/standards?year=113&type=gsat
 * 
 * 返回指定年份的五標資料
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const type = searchParams.get("type");  // "gsat" or "bifurcated"

    if (!year || !type) {
      return NextResponse.json(
        { error: "Missing year or type parameter" },
        { status: 400 }
      );
    }

    const academic_year = parseInt(year, 10);

    if (Number.isNaN(academic_year) || ![113, 114].includes(academic_year)) {
      return NextResponse.json(
        { error: "Invalid year. Must be 113 or 114" },
        { status: 400 }
      );
    }

    if (!["gsat", "bifurcated"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'gsat' or 'bifurcated'" },
        { status: 400 }
      );
    }

    await dbConnect();
    const db = await dbConnect();

    let collection_name: string;
    let result: any;

    if (type === "gsat") {
      collection_name = "assessment_standards";
      const collection = db.collection(collection_name);
      result = await collection.findOne({ academic_year });
    } else {
      collection_name = "bifurcated_standards";
      const collection = db.collection(collection_name);
      result = await collection.findOne({ academic_year });
    }

    if (!result) {
      return NextResponse.json(
        { error: `No ${type} standards found for year ${academic_year}` },
        { status: 404 }
      );
    }

    // 移除 MongoDB 內部 ID
    const { _id, ...data } = result;

    return NextResponse.json(
      {
        success: true,
        data
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Standards API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error"
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed. Use GET instead." },
    { status: 405 }
  );
}
