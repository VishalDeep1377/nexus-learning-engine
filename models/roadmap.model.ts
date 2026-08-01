import mongoose from "mongoose";
interface IRoadmap{
    _id ?:mongoose.Types.ObjectId;
    title:string;
    steps:string[];
    resources:string[];
    completedSteps?: {
        userId: mongoose.Types.ObjectId;
        stepIndices: number[];
    }[];
}

const roadMapSchema:mongoose.Schema<IRoadmap> = new mongoose.Schema({
    title:{
        type:String,
    },
    steps:{
        type:[String],
    },
    resources:{
        type:[String],
    },
    completedSteps: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        stepIndices: [Number]
    }]
}, {timestamps: true})

const Roadmap= mongoose.models.Roadmap || mongoose.model<IRoadmap>("Roadmap",roadMapSchema);
export default Roadmap;