# AIU ANVESHAN 2026 — Research Experiment Verification & Technical Methodology

**Project Title**: Nexus Learning Engine (Code-To-Career)  
**Experiment File**: `scripts/experiment_baseline_vs_mcp.ts`  
**Report Artifacts**: `experiments/baseline_vs_mcp_report.md` & `experiments/baseline_vs_mcp_results.json`  
**Target Model**: Google Gemini (`gemini-flash-lite-latest`)  

---

## 1. Executive Summary & Verification Matrix

This document provides complete, code-verified technical proof of the **Baseline vs. MCP Personalization Experiment** conducted for the Nexus Learning Engine. It verifies all 8 experimental parameters required for academic and competition defense.

| Parameter | Verified Experimental Setup | Source Code Location |
| :--- | :--- | :--- |
| **1. Target Model & Version** | `gemini-flash-lite-latest` via `@google/generative-ai` SDK | `scripts/experiment_baseline_vs_mcp.ts:38` |
| **2. Test Profile Count** | **5 Controlled Learner Profiles** | `scripts/experiment_baseline_vs_mcp.ts:94-545` |
| **3. Baseline Condition** | Prompt with basic user input (Skill, Level, Goal) & job titles; **zero learner telemetry** | `lib/geminiRoadmapPrompt.ts:194-233` |
| **4. MCP Proposed Condition** | Full `GeminiLearnerContext` injection (Assessments, Strengths, Weak Areas, Job Frequencies) | `lib/geminiRoadmapPrompt.ts:105-193` |
| **5. Input Control** | **Identical** target roles, experience levels, and job listings passed to both prompts | `scripts/experiment_baseline_vs_mcp.ts:707-722` |
| **6. Evaluation Formulas** | Automated objective string parsing & 7-point qualitative rubric (1–5 scale) | `scripts/experiment_baseline_vs_mcp.ts:587-692` |
| **7. Blind Assignment** | Randomized `Roadmap A` vs `Roadmap B` assignment to eliminate evaluation bias | `scripts/experiment_baseline_vs_mcp.ts:723-728` |
| **8. Raw Data Artifacts** | Fully serialized JSON results and Markdown report | `experiments/baseline_vs_mcp_results.json` |

---

## 2. Exact Prompt Formulation Breakdown

### 2.1 Baseline Prompt Formulation (Ungrounded LLM)

The baseline prompt simulates standard EdTech wrappers by sending only user-declared target goals without background telemetry:

```markdown
## CodeToCareer AI Roadmap Agent

You are an expert career mentor AI generating a personalised learning roadmap.

**Job Market Context:**
  1. "Junior Data Scientist" at Analytics Co
  2. "Data Analyst" at Insight Health

### CAREER GOAL
- Skill: Data Science
- Experience: Beginner
- Learning Preference: Practical/project-based
- Expected Outcome: Become job-ready for Data Science roles

### INSTRUCTIONS
Generate 10–15 actionable learning steps tailored to the above goal.
Include 6–10 real, valid resource URLs.

### REQUIRED OUTPUT FORMAT (strict JSON only)
{ "roadmap": ["Step 1...", "Step 2..."], "resources": ["https://..."] }
```

---

### 2.2 Proposed MCP Prompt Formulation (Context-Grounded)

The MCP prompt enriches the query with structured telemetry from MongoDB:

```markdown
## CodeToCareer AI Roadmap Agent

You are an expert career mentor AI generating a personalised, job-market-aware learning roadmap.

---
### LEARNER PROFILE
Name: Alex (Beginner DS)
Experience Level: Beginner
Current Skills: Python, Statistics

---
### CAREER GOAL
Target Skill: Data Science
Experience Level: Beginner
Learning Preference: Practical/project-based
Expected Outcome: Become job-ready for Data Science roles

---
### LEARNING HISTORY
No existing roadmaps yet.

---
### ASSESSMENT PERFORMANCE
- Coding: 5 attempts, avg score 78/100
  Weak topics: SQL Queries, Database Joins
  Strong topics: Python Basics, Control Flow
- Quizzes: 4 attempts, avg accuracy 65%
  Weak topics: Machine Learning Algorithms, Overfitting

---
### SKILL GAP ANALYSIS
Strong areas (do not repeat as primary focus): Python Basics, Statistics
Weak areas (prioritise in roadmap): SQL Queries, Database Joins, Machine Learning Algorithms
Missing market skills (include in roadmap): SQL, Scikit-learn, Pandas

---
### JOB MARKET SIGNALS (live data)
Source: LinkedIn Jobs API
Top in-demand skills: Python (2/2), SQL (2/2), Machine Learning (2/2), Pandas (1/2)

---
### ROADMAP GENERATION INSTRUCTIONS
1. Address the learner's identified WEAK AREAS first (from assessments)
2. Fill MISSING MARKET SKILLS that the learner doesn't already know
3. Build toward the CAREER GOAL
4. Align with JOB MARKET DEMAND
5. Do NOT recommend topics where the learner is already STRONG unless prerequisites

### REQUIRED OUTPUT FORMAT (strict JSON only)
{ "roadmap": ["Step 1...", "Step 2..."], "resources": ["https://..."] }
```

---

## 3. The 5 Controlled Learner Test Profiles

| Profile ID | Profile Name | Experience Level | Key Strengths (Suppressed) | Identified Weak Areas (Targeted) |
| :---: | :--- | :---: | :--- | :--- |
| **Case 1** | Beginner Data Scientist | Beginner | Python Basics, Statistics | SQL Queries, DB Joins, Overfitting |
| **Case 2** | Intermediate MLOps Developer | Intermediate | Data Wrangling, Scikit-learn | PyTorch Tensors, Model Deployment, MLOps |
| **Case 3** | Python Dev / SQL Beginner | Intermediate | Python AsyncIO, FastAPI, OOP | Complex SQL Joins, Query Optimization |
| **Case 4** | C++ Dev / ML Beginner | Advanced | C++ Memory, Multi-threading | Backpropagation Math, Gradient Descent |
| **Case 5** | Full-Stack 3-Roadmap Completer | Intermediate | React Components, REST APIs | WebSockets Real-time Sync, Docker |

---

## 4. Evaluation Formulas & Scoring Algorithms

### 4.1 Objective Metric Formulas

1. **Weak Skills Addressed**:
   $$\text{WeakSkillsAddressed} = \sum_{i=1}^{N} \mathbb{I}\left( w_i \in \text{RoadmapText} \right)$$
2. **Market Skills Addressed**:
   $$\text{MarketSkillsAddressed} = \sum_{j=1}^{M} \mathbb{I}\left( s_j \in \text{RoadmapText} \right)$$
3. **Unnecessary Strong-Skill Repetition**:
   $$\text{RedundantSteps} = \sum_{k=1}^{K} \mathbb{I}\left( \text{"Learn " } + \text{strength}_k \in \text{RoadmapText} \right)$$

---

### 4.2 Quantitative Scoring Rubric (1–5 Scale)

Each roadmap is evaluated across 7 criteria:
1. **Personalization (1–5)**: Evaluates whether weak areas are integrated and mastered topics are suppressed.
2. **Skill-Gap Alignment (1–5)**: $1 + \left( \frac{\text{Weak Skills Addressed}}{\text{Total Weak Skills}} \times 4 \right)$.
3. **Job-Market Alignment (1–5)**: $2 + \left( \frac{\text{Market Skills Addressed}}{\text{Total Market Skills}} \times 3 \right)$.
4. **Learning Sequence (1–5)**: Evaluates logical progression step order.
5. **Practical Applicability (1–5)**: Measures presence of project building and deployment milestones.
6. **Resource Relevance (1–5)**: Evaluates valid URL links provided.
7. **Career-Goal Alignment (1–5)**: Evaluates target outcome fulfillment.

---

## 5. Verified Raw Results & Statistical Gains

```
                    BASELINE vs MCP SCORE COMPARISON

Criterion                  Baseline Avg   MCP Avg   Improvement (%)
-------------------------------------------------------------------
Personalization            2.50 / 5.00    5.00 / 5.00   +100.0%
Skill-Gap Alignment        1.60 / 5.00    4.20 / 5.00   +162.5%
Job-Market Alignment       4.00 / 5.00    4.60 / 5.00   +15.0%
Learning Sequence          4.50 / 5.00    4.50 / 5.00    0.0%
Practical Applicability    4.50 / 5.00    4.50 / 5.00    0.0%
Resource Relevance        4.80 / 5.00    4.80 / 5.00    0.0%
Career-Goal Alignment      4.10 / 5.00    4.30 / 5.00   +4.9%
-------------------------------------------------------------------
OVERALL SCORE              3.71 / 5.00    4.56 / 5.00   +22.9%
```

### Objective Results
- **Weak Skills Targeted**: `16 / 20` (MCP) vs `3 / 20` (Baseline).
- **Redundant Steps Included**: `0` redundant steps (MCP) vs `5` redundant steps (Baseline).

---

## Conclusion

The experimental setup is 100% verified, reproducible via `npx ts-node scripts/experiment_baseline_vs_mcp.ts`, and grounded in strict comparative controls.

---
*Document prepared for AIU Anveshan 2026 Student Research Convention.*
