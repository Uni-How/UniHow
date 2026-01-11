import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

/**
 * 科系錄取統計 API 端點
 * GET /api/departments-stats?year=113&school=國立臺灣師範大學
 * 
 * 返回科系的錄取統計資訊
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const school = searchParams.get("school");
    const department = searchParams.get("department");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!year) {
      return NextResponse.json(
        { error: "Missing year parameter" },
        { status: 400 }
      );
    }

    const academic_year = parseInt(year, 10);

    if (Number.isNaN(academic_year)) {
      return NextResponse.json(
        { error: "Invalid year format" },
        { status: 400 }
      );
    }

    await dbConnect();
    const db = await dbConnect();
    const collection = db.collection("departments");

    // 構建查詢條件
    const query: any = { admission_year: academic_year };

    if (school) {
      query.school_name = school;
    }

    if (department) {
      query.department_name = new RegExp(department, "i");
    }

    // 限制回傳數量
    const results = await collection
      .find(query)
      .limit(limit)
      .toArray();

    if (results.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          message: "No departments found matching criteria"
        },
        { status: 200 }
      );
    }

    // 清理結果（移除 MongoDB 內部 ID）
    const cleaned_results = results.map((dept: any) => {
      const { _id, ...rest } = dept;
      return rest;
    });

    return NextResponse.json(
      {
        success: true,
        count: cleaned_results.length,
        data: cleaned_results
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Departments stats API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error"
      },
      { status: 500 }
    );
  }
}

// 搜尋學校列表
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, academic_year } = body;

    if (action === "get_schools") {
      if (!academic_year) {
        return NextResponse.json(
          { error: "Missing academic_year" },
          { status: 400 }
        );
      }

      await dbConnect();
      const db = await dbConnect();
      const collection = db.collection("departments");

      const schools = await collection
        .distinct("school_name", { admission_year: academic_year })
        .catch(() => []);

      return NextResponse.json(
        {
          success: true,
          schools: schools.sort()
        },
        { status: 200 }
      );
    }

    if (action === "get_departments") {
      const { school_name } = body;

      if (!academic_year || !school_name) {
        return NextResponse.json(
          { error: "Missing academic_year or school_name" },
          { status: 400 }
        );
      }

      await dbConnect();
      const db = await dbConnect();
      const collection = db.collection("departments");

      const departments = await collection
        .distinct("department_name", {
          admission_year: academic_year,
          school_name
        })
        .catch(() => []);

      return NextResponse.json(
        {
          success: true,
          departments: departments.sort()
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Departments search API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error"
      },
      { status: 500 }
    );
  }
}
