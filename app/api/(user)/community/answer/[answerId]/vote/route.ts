import { NextRequest, NextResponse } from "next/server";
import { Answer, Vote, User } from "@/models";
import { Ivote } from "@/models/vote.model";

export async function POST(
  req: NextRequest,
  { params }: { params: { answerId: string } }
) {
  try {
    const answerId = params.answerId;
    const { userId, voteType } = await req.json();

    if (!userId || !voteType) {
      return NextResponse.json(
        { message: "User ID and vote type are required" },
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

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has already voted on this answer
    const existingVote = await Vote.findOne({
      user: userId,
      answer: answerId
    });

    if (existingVote) {
      // If vote type is the same, remove the vote (toggle off)
      if (existingVote.voteType === voteType) {
        // Remove vote from answer
        answer.votes = answer.votes.filter(
          (voteId) => voteId.toString() !== existingVote._id.toString()
        );
        await answer.save();

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
        answer: answerId,
        voteType: voteType
      });

      // Add vote to answer
      answer.votes.push(newVote._id);
      await answer.save();

      return NextResponse.json(
        { message: "Vote added successfully", vote: newVote },
        { status: 201 }
      );
    }
  } catch (error) {
    console.log("Error voting on answer", error);
    return NextResponse.json(
      { message: "Error voting on answer" },
      { status: 500 }
    );
  }
} 