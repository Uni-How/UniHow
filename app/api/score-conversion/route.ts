import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

/**
 * 級分轉換 API 端點
 * GET /api/score-conversion?year=113&subject=chinese&level=13
 * 
 * 將 15 級分轉換為 60 級分
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const subject = searchParams.get("subject");
    const level = searchParams.get("level");

    if (!year || !subject || !level) {
      return NextResponse.json(
        { error: "Missing year, subject, or level parameter" },
        { status: 400 }
      );
    }

    const academic_year = parseInt(year, 10);
    const level_15 = parseInt(level, 10);

    if (Number.isNaN(academic_year) || ![113, 114].includes(academic_year)) {
      return NextResponse.json(
        { error: "Invalid year. Must be 113 or 114" },
        { status: 400 }
      );
    }

    if (Number.isNaN(level_15) || level_15 < 0 || level_15 > 15) {
      return NextResponse.json(
        { error: "Invalid level. Must be 0-15" },
        { status: 400 }
      );
    }

    const valid_subjects = [
      "chinese",
      "english",
      "math_a",
      "math_b",
      "social",
      "nature"
    ];

    if (!valid_subjects.includes(subject)) {
      return NextResponse.json(
        { error: `Invalid subject. Must be one of: ${valid_subjects.join(", ")}` },
        { status: 400 }
      );
    }

    await dbConnect();
    const db = await dbConnect();
    const collection = db.collection("score_conversions");

    const doc = await collection.findOne({ academic_year });

    if (!doc) {
      return NextResponse.json(
        { error: `No conversion data found for year ${academic_year}` },
        { status: 404 }
      );
    }

    const subject_data = doc.gsat_subjects[subject];

    if (!subject_data) {
      return NextResponse.json(
        { error: `Subject ${subject} not found` },
        { status: 404 }
      );
    }

    const score_60 = subject_data.conversions[level_15.toString()];

    if (score_60 === undefined) {
      return NextResponse.json(
        { error: `Conversion data not found for level ${level_15}` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          academic_year,
          subject,
          level_15,
          level_60: score_60,
          conversion_rule: "15→60: each grade decreases by 4 points"
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Score conversion API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error"
      },
      { status: 500 }
    );
  }
}

// 批量轉換
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { academic_year, conversions } = body;

    if (!academic_year || !conversions || !Array.isArray(conversions)) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    await dbConnect();
    const db = await dbConnect();
    const collection = db.collection("score_conversions");

    const doc = await collection.findOne({ academic_year });

    if (!doc) {
      return NextResponse.json(
        { error: `No conversion data found for year ${academic_year}` },
        { status: 404 }
      );
    }

    const results = conversions.map((conv: any) => {
      const { subject, level_15 } = conv;
      const subject_data = doc.gsat_subjects[subject];

      if (!subject_data) {
        return {
          subject,
          level_15,
          error: `Subject ${subject} not found`
        };
      }

      const score_60 = subject_data.conversions[level_15.toString()];

      if (score_60 === undefined) {
        return {
          subject,
          level_15,
          error: `Conversion data not found for level ${level_15}`
        };
      }

      return {
        subject,
        level_15,
        level_60: score_60,
        success: true
      };
    });

    return NextResponse.json(
      {
        success: true,
        academic_year,
        results
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Batch conversion API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error"
      },
      { status: 500 }
    );
  }
}
