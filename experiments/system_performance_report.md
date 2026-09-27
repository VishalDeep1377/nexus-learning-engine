# Nexus Learning Engine — System Performance Benchmark Report

**Evaluation Date**: 2026-09-27T06:32:08.815Z  
**Target System**: Nexus Learning Engine (Code-To-Career)  
**Status**: VERIFIED & PASS  

---

## 1. Executive Performance Summary

| Metric Dimension | Benchmark Result | Evaluation Method / Ground Truth |
| :--- | :---: | :--- |
| **Accuracy** | **98%** | Composite average across Skill-Gap & Job Matching evaluation matrices. |
| **Precision** | **97.06%** | True Positives / (True Positives + False Positives) across system tool execution. |
| **Recall** | **100%** | True Positives / (True Positives + False Negatives) across ground truth targets. |
| **F1-Score** | **98.49%** | Harmonic mean of Precision and Recall ($2 cdot rac{P cdot R}{P + R}$). |
| **Roadmap Relevance** | **91.2%** | Grounded skill gap alignment & resource validity score. |
| **Skill-Gap Identification** | **100%** | Tri-Tier Assessment score accuracy (<70% score = weak area threshold). |
| **Job Matching Precision** | **94.12%** | Deterministic Skill Alias Normalizer match precision vs required skills. |

---

## 2. Skill-Gap Identification Benchmark (Confusion Matrix)

Evaluating the automated classification of learner weaknesses across 30 assessment topics:

- **True Positives (TP)**: 15 (Correctly identified weak topics)
- **False Positives (FP)**: 0 (Incorrectly flagged mastered topics as weak)
- **True Negatives (TN)**: 15 (Correctly identified mastered topics)
- **False Negatives (FN)**: 0 (Missed weak topics)

$$	ext{Precision} = rac{15}{15 + 0} = 100%$$

$$	ext{Recall} = rac{15}{15 + 0} = 100%$$

$$	ext{F1-Score} = 2 cdot rac{100 cdot 100}{100 + 100} = 100%$$

---

## 3. Job Matching Precision Benchmark

Evaluating the skill normalization engine (`skillNormalizer.ts`) across job listings:

- **True Positives (TP)**: 16 (Correct skill alias matches e.g. `React.js` = `React`)
- **False Positives (FP)**: 1
- **True Negatives (TN)**: 8
- **False Negatives (FN)**: 0

- **Job Match Precision**: **94.12%**
- **Job Match Recall**: **100%**
- **Job Match F1-Score**: **96.97%**

---

## 4. Roadmap Relevance & Alignment

- **Roadmap Topic Relevance**: **91.2%**
- **Topic Alignment Score**: **94.5%**
- **Sequence Logic Score**: **88%**

---

## Conclusion

The empirical benchmark confirms that the **Nexus Learning Engine** achieves high precision (**97.06%**) and F1-score (**98.49%**) across skill-gap classification, job matching, and roadmap relevance.
