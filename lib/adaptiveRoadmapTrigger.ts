/**
 * lib/adaptiveRoadmapTrigger.ts
 *
 * Deterministic Adaptive Roadmap Trigger logic.
 * Detects meaningful learner skill-profile changes after assessments
 * and triggers learner notification for roadmap adaptation.
 */

import mongoose from "mongoose";
import User from "@/models/user.model";
import Roadmap from "@/models/roadmap.model";
import { buildLearnerContext } from "./buildLearnerContext";
import { CareerParams } from "@/types/mcp";

export interface AdaptationResult {
  adaptationRequired: boolean;
  reason?: string;
  improvedSkills?: string[];
  newWeakSkills?: string[];
  resolvedWeakSkills?: string[];
  newMissingSkills?: string[];
  changedPriorityAreas?: string[];
  timestamp?: Date;
  dismissed?: boolean;
}

const DEFAULT_CAREER_PARAMS: CareerParams = {
  skill: "General Development",
  experience: "Intermediate",
  learningPreference: "Practical",
  expectedOutcome: "Skill Enhancement",
};

/**
 * Checks for deterministic skill profile changes after an assessment submission.
 * Triggers adaptation notice if meaningful changes occur.
 */
export async function checkAndTriggerAdaptation(userId: string): Promise<AdaptationResult> {
  try {
    const dbUserId = typeof userId === "string" ? userId : (userId as any).toString();
    const user = await User.findById(dbUserId);
    if (!user) {
      return { adaptationRequired: false };
    }

    // Determine current career params or fallback
    const careerParams: CareerParams = {
      skill: user.bio ? user.bio.slice(0, 30) : DEFAULT_CAREER_PARAMS.skill,
      experience: (user.experienceLevel as any) || DEFAULT_CAREER_PARAMS.experience,
      learningPreference: DEFAULT_CAREER_PARAMS.learningPreference,
      expectedOutcome: DEFAULT_CAREER_PARAMS.expectedOutcome,
    };

    // Calculate current learner context via buildLearnerContext
    const context = await buildLearnerContext(dbUserId, careerParams, [], []);

    const currStrengths = context.skillGap.strengths || [];
    const currWeakAreas = context.skillGap.weakAreas || [];
    const currMissingSkills = context.skillGap.missingSkills || [];
    const currPriorityAreas = context.summary.priorityAreas || [];

    const prevSnapshot = user.skillSnapshot;
    const hasInitialSnapshot = Boolean(
      prevSnapshot &&
      (
        (prevSnapshot.strengths && prevSnapshot.strengths.length > 0) ||
        (prevSnapshot.weakAreas && prevSnapshot.weakAreas.length > 0) ||
        (prevSnapshot.missingSkills && prevSnapshot.missingSkills.length > 0) ||
        (prevSnapshot.priorityAreas && prevSnapshot.priorityAreas.length > 0)
      )
    );

    // First time running — initialize snapshot and return no adaptation required
    if (!hasInitialSnapshot) {
      user.skillSnapshot = {
        strengths: currStrengths,
        weakAreas: currWeakAreas,
        missingSkills: currMissingSkills,
        priorityAreas: currPriorityAreas,
        timestamp: new Date(),
      };
      await user.save();
      return { adaptationRequired: false };
    }

    const prevStrengths = prevSnapshot.strengths || [];
    const prevWeakAreas = prevSnapshot.weakAreas || [];
    const prevMissingSkills = prevSnapshot.missingSkills || [];
    const prevPriorityAreas = prevSnapshot.priorityAreas || [];

    // Deterministic change calculation
    const resolvedWeakSkills = prevWeakAreas.filter((w: string) => !currWeakAreas.includes(w));
    const newWeakSkills = currWeakAreas.filter((w: string) => !prevWeakAreas.includes(w));
    const improvedSkills = currStrengths.filter((s: string) => !prevStrengths.includes(s));
    const newMissingSkills = currMissingSkills.filter((m: string) => !prevMissingSkills.includes(m));
    const changedPriorityAreas = currPriorityAreas.filter((p: string) => !prevPriorityAreas.includes(p));

    const adaptationRequired =
      resolvedWeakSkills.length > 0 ||
      newWeakSkills.length > 0 ||
      improvedSkills.length > 0 ||
      newMissingSkills.length > 0 ||
      changedPriorityAreas.length > 0;

    // Update snapshot to current state
    user.skillSnapshot = {
      strengths: currStrengths,
      weakAreas: currWeakAreas,
      missingSkills: currMissingSkills,
      priorityAreas: currPriorityAreas,
      timestamp: new Date(),
    };

    if (adaptationRequired) {
      const reasons: string[] = [];
      if (resolvedWeakSkills.length > 0) {
        reasons.push(`✓ Resolved weak areas: ${resolvedWeakSkills.join(", ")}`);
      }
      if (improvedSkills.length > 0) {
        reasons.push(`✓ Improved proficiency: ${improvedSkills.join(", ")}`);
      }
      if (newWeakSkills.length > 0) {
        reasons.push(`⚠ Identified new weakness: ${newWeakSkills.join(", ")}`);
      }
      if (newMissingSkills.length > 0) {
        reasons.push(`⚠ Priority market skills needed: ${newMissingSkills.join(", ")}`);
      }

      const reason = reasons.join(" • ") || "Skill profile updated based on recent assessment";

      const noticeData: AdaptationResult = {
        adaptationRequired: true,
        reason,
        improvedSkills,
        newWeakSkills,
        resolvedWeakSkills,
        newMissingSkills,
        changedPriorityAreas,
        timestamp: new Date(),
        dismissed: false,
      };

      user.adaptationNotice = noticeData;
      await user.save();
      return noticeData;
    } else {
      // If user already has an active, un-dismissed notice, preserve it until learner acts
      if (user.adaptationNotice && user.adaptationNotice.adaptationRequired && !user.adaptationNotice.dismissed) {
        return user.adaptationNotice;
      }
      await user.save();
      return { adaptationRequired: false };
    }

  } catch (err: any) {
    console.error("[checkAndTriggerAdaptation] Error checking skill profile change:", err?.message || err, err?.stack);
    return { adaptationRequired: false };
  }
}
