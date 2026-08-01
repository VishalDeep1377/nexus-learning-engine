import { NextRequest, NextResponse } from "next/server";
import { Answer, Post, User } from "@/models";
import { Ianswer } from "@/models/answer.model";

export async function POST(req: NextRequest) {
  try {
    const { content, userId, postId } = await req.json();

    if (!content || !userId || !postId) {
      return NextResponse.json(
        { message: "Content, user ID, and post ID are required" },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      );
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Create a new answer
    const newAnswer = await Answer.create<Ianswer>({
      content,
      user: userId,
      post: postId
    });

    // Add answer to post
    post.answers.push(newAnswer._id);
    await post.save();

    // Add answer to user's answersGiven
    user.answersGiven.push(newAnswer._id);
    await user.save();

    // Populate user data for the response
    const populatedAnswer = await Answer.findById(newAnswer._id).populate('user', 'name email');

    return NextResponse.json(
      { message: "Answer added successfully", answer: populatedAnswer },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error adding answer", error);
    return NextResponse.json(
      { message: "Error adding answer" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const postId = url.searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { message: "Post ID is required" },
        { status: 400 }
      );
    }

    // Get all answers for a specific post
    const answers = await Answer.find({ post: postId })
      .populate('user', 'name email')
      .populate('votes')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Answers fetched successfully", answers },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error fetching answers", error);
    return NextResponse.json(
      { message: "Error fetching answers" },
      { status: 500 }
    );
  }
}
