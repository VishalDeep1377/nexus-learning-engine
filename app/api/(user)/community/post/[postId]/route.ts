import { NextRequest, NextResponse } from "next/server";
import { Post } from "@/models";
import { connectDb } from "@/config/db.config";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await connectDb();
    const { postId } = await params;

    const post = await Post.findById(postId)
      .populate('user', 'name email')
      .populate({
        path: 'answers',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('votes');

    if (!post) {
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Post fetched successfully", post },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error fetching post", error);
    return NextResponse.json(
      { message: "Error fetching post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await connectDb();
    const { postId } = await params;
    const { title, description, tags, status } = await req.json();

    const post = await Post.findById(postId);

    if (!post) {
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      );
    }

    // Update post fields if provided
    if (title) post.title = title;
    if (description) post.description = description;
    if (tags) post.tags = tags;
    if (status) post.status = status;

    await post.save();

    return NextResponse.json(
      { message: "Post updated successfully", post },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error updating post", error);
    return NextResponse.json(
      { message: "Error updating post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await connectDb();
    const { postId } = await params;
    const { userId } = await req.json();

    const post = await Post.findById(postId);

    if (!post) {
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      );
    }

    // Ensure only the post author can delete their post
    const authorId = post.user.toString();
    if (authorId !== userId) {
      return NextResponse.json(
        { message: "Unauthorized: You can only delete your own posts" },
        { status: 403 }
      );
    }

    await Post.findByIdAndDelete(postId);

    return NextResponse.json(
      { message: "Post deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error deleting post", error);
    return NextResponse.json(
      { message: "Error deleting post" },
      { status: 500 }
    );
  }
} 