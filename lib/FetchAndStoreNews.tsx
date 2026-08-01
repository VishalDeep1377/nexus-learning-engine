import axios from "axios";
import { News } from "@/models";
import { connectDb } from "@/config/db.config";

async function fetchAndStoreNews() {
  await connectDb();
  try {
    const newsUrl = process.env.NEWS_URL;

    if (!newsUrl) {
      console.warn("NEWS_URL env variable is not set. Skipping news fetch.");
      return { success: false, message: "NEWS_URL not configured" };
    }

    console.log("Fetching news from external source...");
    const response = await axios.get(newsUrl, { timeout: 10000 });
    const news = response.data;

    if (!news.articles || news.articles.length === 0) {
      console.log("No articles returned from news API.");
      return { success: false, message: "No articles found" };
    }

    // Filter out removed/invalid articles
    const validArticles = news.articles.filter(
      (article: any) =>
        article.title &&
        article.title !== "[Removed]" &&
        article.description &&
        article.description !== "[Removed]" &&
        article.url &&
        article.url !== "[Removed]"
    );

    if (validArticles.length === 0) {
      return { success: false, message: "No valid articles found" };
    }

    // Clear old news before storing new ones
    await News.deleteMany({});

    const formattedNews = validArticles.map((article: any) => ({
      author: article.author || article.source?.name || "Unknown",
      title: article.title,
      description: article.description,
      url: article.url,
      imageUrl: article.urlToImage,
      source: article.source?.name || "Unknown",
      publishedAt: new Date(article.publishedAt),
    }));

    await News.insertMany(formattedNews);
    console.log(`✅ News updated successfully. Stored ${formattedNews.length} articles.`);
    return { success: true, count: formattedNews.length };
  } catch (error: any) {
    console.error("❌ Error fetching and storing news:", error?.message || error);
    return { success: false, message: error?.message || "Unknown error" };
  }
}

export default fetchAndStoreNews;
