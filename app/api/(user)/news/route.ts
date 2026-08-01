import { NextResponse, NextRequest } from "next/server";
import { News } from "@/models";
import { connectDb } from "@/config/db.config";

export async function GET(req: NextRequest) {
  await connectDb();
  try {
    const { searchParams } = new URL(req.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;

    // Search / filter
    const q = searchParams.get("q") || "";
    const source = searchParams.get("source") || "";

    // Build query filter
    const filter: Record<string, any> = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { author: { $regex: q, $options: "i" } },
      ];
    }
    if (source) {
      filter.source = { $regex: source, $options: "i" };
    }

    const [allNews, total] = await Promise.all([
      News.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      News.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        message: "News fetched successfully",
        allNews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching news from DB:", error);
    return NextResponse.json(
      { message: "Failed to fetch news" },
      { status: 500 }
    );
  }
}