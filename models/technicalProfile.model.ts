import mongoose from "mongoose";

const technicalProfileSchema = new mongoose.Schema({
  Student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  technology: [
    {
      name: {
        type: String,     
        required: true,
      },
      skillLevel: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "pro"],
      },
      goal: {
        type: String,
        enum: ["college placement", "job", "skill development", "not sure"],
      },
      yearsOfExperience: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],

  additionalInfo: [
    {
      languages: [
        {
          type: String,
        },
      ],
      frameworks: [
        {
          type: String,
        },
      ],
      databases: [
        {
          type: String,
        },
      ],
    },
  ],
});
