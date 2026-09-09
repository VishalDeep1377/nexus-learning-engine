/**
 * lib/agents/self-assessment/assessment-analysis-agent.ts
 * Consumes real assessment history and identifies strengths, gaps, and recommendations.
 * NEVER fabricates data — only analyses real stored attempts.
 */

export interface AssessmentPerformance {
  coding: { problemsSolved: number; averageScore: number; recentWeakTopics: string[] };
  speech: { sessions: number; averageScore: number; recentWeakAreas: string[] };
  quizzes: { questionsSolved: number; accuracy: number; weakTopics: string[] };
  aptitude: { questionsSolved: number; accuracy: number; weakCategories: string[] };
}

export interface SkillGapAnalysis {
  overall: 'Beginner' | 'Intermediate' | 'Advanced';
  coding: 'Strong' | 'Moderate' | 'Needs Improvement';
  communication: 'Strong' | 'Moderate' | 'Needs Improvement';
  technicalKnowledge: 'Strong' | 'Moderate' | 'Needs Improvement';
  aptitude: 'Strong' | 'Moderate' | 'Needs Improvement';
  topRecommendations: string[];
  adaptiveDifficulty: {
    coding: 'Easy' | 'Medium' | 'Hard';
    quizzes: 'Easy' | 'Medium' | 'Hard';
    aptitude: 'Easy' | 'Medium' | 'Hard';
  };
}

function rateMetric(score: number): 'Strong' | 'Moderate' | 'Needs Improvement' {
  if (score >= 80) return 'Strong';
  if (score >= 55) return 'Moderate';
  return 'Needs Improvement';
}

function adaptiveDiff(accuracy: number): 'Easy' | 'Medium' | 'Hard' {
  if (accuracy >= 90) return 'Hard';
  if (accuracy >= 70) return 'Medium';
  return 'Easy';
}

export function analysePerformance(data: AssessmentPerformance): SkillGapAnalysis {
  const codingRating = rateMetric(data.coding.averageScore);
  const speechRating = rateMetric(data.speech.averageScore * 10); // 0-10 scaled to 0-100
  const quizRating = rateMetric(data.quizzes.accuracy);
  const aptitudeRating = rateMetric(data.aptitude.accuracy);

  const ratings = [codingRating, speechRating, quizRating, aptitudeRating];
  const strongCount = ratings.filter((r) => r === 'Strong').length;
  const overall =
    strongCount >= 3 ? 'Advanced' : strongCount >= 1 ? 'Intermediate' : 'Beginner';

  const recommendations: string[] = [];

  if (codingRating === 'Needs Improvement' || codingRating === 'Moderate') {
    if (data.coding.recentWeakTopics.length > 0) {
      recommendations.push(`Practice Coding Lab: ${data.coding.recentWeakTopics.slice(0, 2).join(', ')}`);
    } else {
      recommendations.push('Solve more coding challenges to improve your score.');
    }
  }
  if (speechRating === 'Needs Improvement') {
    recommendations.push('Practice Speech sessions to improve interview communication.');
  }
  if (quizRating !== 'Strong' && data.quizzes.weakTopics.length > 0) {
    recommendations.push(`Review quiz topics: ${data.quizzes.weakTopics.slice(0, 2).join(', ')}`);
  }
  if (aptitudeRating !== 'Strong' && data.aptitude.weakCategories.length > 0) {
    recommendations.push(`Aptitude Arena: Focus on ${data.aptitude.weakCategories.slice(0, 2).join(', ')}`);
  }
  if (recommendations.length === 0) {
    recommendations.push('Great performance across all areas! Keep practising consistently.');
  }

  return {
    overall,
    coding: codingRating,
    communication: speechRating,
    technicalKnowledge: quizRating,
    aptitude: aptitudeRating,
    topRecommendations: recommendations,
    adaptiveDifficulty: {
      coding: adaptiveDiff(data.coding.averageScore),
      quizzes: adaptiveDiff(data.quizzes.accuracy),
      aptitude: adaptiveDiff(data.aptitude.accuracy),
    },
  };
}
