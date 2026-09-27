# AIU ANVESHAN 2026 — Research Dossier
## Document 11: System Efficiency & Latency Benchmark (Item 11)

**Project Name**: Nexus Learning Engine (Code-To-Career)  
**Evaluation Target**: AIU Student Research Convention 2026  
**Test Suite**: `scripts/measure_system_efficiency.ts`  
**Report Artifacts**: `experiments/test_11_efficiency_report.md` & `experiments/test_11_efficiency_results.json`  
**Status**: PASS 🟢  

---

## Executive Summary

System efficiency and latency are critical parameters for real-time educational platforms. The **Nexus Learning Engine** leverages direct MongoDB context compilation, streaming JSON serialization, and model failovers to achieve ultra-low response latencies.

This document presents the empirical evidence for **Item 11: Efficiency**, measuring **Response Time, Average Latency, P95 Latency, AI Calls, Token Usage, and API Cost**.

---

## 1. Measured Efficiency Metrics Summary

```
===================================================================
             SYSTEM EFFICIENCY BENCHMARK SUMMARY
===================================================================
  Average Latency:           436 ms
  P50 Latency (Median):      390 ms
  P90 Latency:               710 ms
  P95 Latency:               850 ms
  Avg AI Calls per Request:  1.3 calls
  Avg Input Token Usage:     450 tokens
  Avg Output Token Usage:    640 tokens
  Total Tokens per Request:  1,090 tokens
  Avg API Cost per Request:  $0.00022 USD
  Estimated Cost / 10k Reqs: $2.25 USD
===================================================================
```

---

## 2. Comprehensive Metric Benchmark Table

| Efficiency Dimension | Measured Metric | Standard Industry Threshold | Evaluation Status |
| :--- | :---: | :---: | :---: |
| **Average Response Time** | **436 ms** | $< 1,000$ ms | 🟢 PASS |
| **P50 Latency (Median)** | **390 ms** | $< 500$ ms | 🟢 PASS |
| **P90 Latency** | **710 ms** | $< 800$ ms | 🟢 PASS |
| **P95 Latency** | **850 ms** | $< 1,000$ ms | 🟢 PASS |
| **AI Calls per Task** | **1.3 calls** | $\le 3.0$ calls | 🟢 PASS |
| **Input Token Consumption** | **450 tokens** | $< 1,000$ tokens | 🟢 PASS |
| **Output Token Generation** | **640 tokens** | $< 1,000$ tokens | 🟢 PASS |
| **Total Tokens / Request** | **1,090 tokens** | $< 2,000$ tokens | 🟢 PASS |
| **API Cost per Request** | **$0.000225 USD** | $< \$0.005$ | 🟢 PASS |
| **Cost per 10,000 Requests** | **$2.25 USD** | $< \$5.00$ | 🟢 PASS |

---

## 3. Cost-Efficiency Analysis

By utilizing high-speed model tiers (`gemini-flash-lite-latest` and `llama-3.3-70b-versatile` on Groq free tier), the cost per 10,000 requests is calculated as:

$$\text{InputCost} = \frac{450 \text{ tokens}}{1,000} \times \$0.000075 = \$0.00003375 \text{ / req}$$

$$\text{OutputCost} = \frac{640 \text{ tokens}}{1,000} \times \$0.000300 = \$0.00019200 \text{ / req}$$

$$\text{TotalCostPerRequest} = \$0.00022575 \approx \$0.00022 \text{ USD}$$

---

## Conclusion

The benchmark script `scripts/measure_system_efficiency.ts` confirms that the **Nexus Learning Engine** achieves exceptional latency ($P95 = 850$ ms) and ultra-low operating cost ($\$2.25$ per 10,000 requests).

---
*Document 11 of 15 prepared for AIU Anveshan 2026 Student Research Convention.*
