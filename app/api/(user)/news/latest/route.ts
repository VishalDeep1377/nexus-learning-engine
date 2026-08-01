import { NextResponse, NextRequest } from "next/server";
import fetchAndStoreNews from "@/lib/FetchAndStoreNews";

export async function GET(req: NextRequest) {
  try {
    const result = await fetchAndStoreNews();
    if (result?.success) {
      return NextResponse.json(
        { message: `News fetched and stored successfully. ${result.count} articles saved.`, ...result },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: result?.message || "Failed to fetch news" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error in /api/news/latest:", error);
    return NextResponse.json(
      { message: "Error fetching latest news", error: error?.message },
      { status: 500 }
    );
  }
}