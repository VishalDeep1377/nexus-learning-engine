import { NextRequest, NextResponse } from "next/server";
import { Post, Vote, User } from "@/models";
import { Ivote } from "@/models/vote.model";

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const { userId, voteType } = await req.json();

    if (!userId || !voteType) {
      return NextResponse.json(
        { message: "User ID and vote type are required" },
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

    // Check if user has already voted on this post
    const existingVote = await Vote.findOne({
      user: userId,
      post: postId
    });

    if (existingVote) {
      // If vote type is the same, remove the vote (toggle off)
      if (existingVote.voteType === voteType) {
        // Remove vote from post
        post.votes = post.votes.filter(
          (voteId) => voteId.toString() !== existingVote._id.toString()
        );
        await post.save();

        // Delete the vote
        await Vote.findByIdAndDelete(existingVote._id);

        return NextResponse.json(
          { message: "Vote removed successfully" },
          { status: 200 }
        );
      } else {
        // Update the vote type
        existingVote.voteType = voteType;
        await existingVote.save();

        return NextResponse.json(
          { message: "Vote updated successfully", vote: existingVote },
          { status: 200 }
        );
      }
    } else {
      // Create a new vote
      const newVote = await Vote.create<Ivote>({
        user: userId,
        post: postId,
        voteType: voteType
      });

      // Add vote to post
      post.votes.push(newVote._id);
      await post.save();

      return NextResponse.json(
        { message: "Vote added successfully", vote: newVote },
        { status: 201 }
      );
    }
  } catch (error) {
    console.log("Error voting on post", error);
    return NextResponse.json(
      { message: "Error voting on post" },
      { status: 500 }
    );
  }
} 