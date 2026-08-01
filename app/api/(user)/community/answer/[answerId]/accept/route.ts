import { NextRequest, NextResponse } from "next/server";
import { Answer, Post } from "@/models";

export async function POST(
  req: NextRequest,
  { params }: { params: { answerId: string } }
) {
  try {
    const answerId = params.answerId;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if answer exists
    const answer = await Answer.findById(answerId);
    if (!answer) {
      return NextResponse.json(
        { message: "Answer not found" },
        { status: 404 }
      );
    }

    // Get the post
    const post = await Post.findById(answer.post).populate('user');
    if (!post) {
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      );
    }

    // Check if the user is the post owner
    if (post.user._id.toString() !== userId) {
      return NextResponse.json(
        { message: "Only the post owner can accept an answer" },
        { status: 403 }
      );
    }

    // Reset all other answers to not accepted
    await Answer.updateMany(
      { post: post._id },
      { accepted: false }
    );

    // Mark this answer as accepted
    answer.accepted = true;
    await answer.save();

    // Mark the post as resolved
    post.status = 'resolved';
    await post.save();

    return NextResponse.json(
      { message: "Answer accepted successfully", answer },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error accepting answer", error);
    return NextResponse.json(
      { message: "Error accepting answer" },
      { status: 500 }
    );
  }
} 