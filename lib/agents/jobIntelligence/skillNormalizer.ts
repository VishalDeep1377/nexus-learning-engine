/**
 * lib/agents/jobIntelligence/skillNormalizer.ts
 *
 * Deterministic skill alias normalization map and similarity matcher.
 * Ensures consistent skill matching e.g. "React.js" = "React", "NodeJS" = "Node.js".
 * Strictly prevents the AI from inventing skills that the learner does not possess.
 */

// Known technology canonical alias mapping
const SKILL_ALIAS_MAP: Record<string, string> = {
  // Frontend
  react: "React",
  "react.js": "React",
  reactjs: "React",
  "next.js": "Next.js",
  nextjs: "Next.js",
  next: "Next.js",
  vue: "Vue.js",
  "vue.js": "Vue.js",
  vuejs: "Vue.js",
  angular: "Angular",
  angularjs: "Angular",
  svelte: "Svelte",
  sveltekit: "Svelte",
  tailwind: "Tailwind CSS",
  tailwindcss: "Tailwind CSS",
  bootstrap: "Bootstrap",
  html: "HTML",
  html5: "HTML",
  css: "CSS",
  css3: "CSS",
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",

  // Backend & Languages
  node: "Node.js",
  "node.js": "Node.js",
  nodejs: "Node.js",
  express: "Express.js",
  "express.js": "Express.js",
  expressjs: "Express.js",
  python: "Python",
  python3: "Python",
  py: "Python",
  java: "Java",
  "c++": "C++",
  cpp: "C++",
  "c#": "C#",
  csharp: "C#",
  golang: "Go",
  go: "Go",
  rust: "Rust",
  php: "PHP",
  ruby: "Ruby",
  rails: "Ruby on Rails",
  "ruby on rails": "Ruby on Rails",
  fastapi: "FastAPI",
  django: "Django",
  flask: "Flask",
  spring: "Spring Boot",
  springboot: "Spring Boot",
  "spring boot": "Spring Boot",

  // Databases
  mongo: "MongoDB",
  mongodb: "MongoDB",
  "mongo db": "MongoDB",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  redis: "Redis",
  sqlite: "SQLite",
  elasticsearch: "Elasticsearch",
  dynamodb: "DynamoDB",
  cassandra: "Cassandra",

  // Data Science & AI/ML
  ml: "Machine Learning",
  "machine learning": "Machine Learning",
  ai: "Artificial Intelligence",
  "artificial intelligence": "Artificial Intelligence",
  dl: "Deep Learning",
  "deep learning": "Deep Learning",
  nlp: "Natural Language Processing",
  pandas: "Pandas",
  numpy: "NumPy",
  scikit: "Scikit-Learn",
  "scikit-learn": "Scikit-Learn",
  sklearn: "Scikit-Learn",
  tensorflow: "TensorFlow",
  pytorch: "PyTorch",
  stats: "Statistics",
  statistics: "Statistics",
  sql: "SQL",

  // DevOps & Cloud
  docker: "Docker",
  k8s: "Kubernetes",
  kubernetes: "Kubernetes",
  aws: "AWS",
  amazon: "AWS",
  gcp: "Google Cloud Platform",
  googlecloud: "Google Cloud Platform",
  azure: "Azure",
  terraform: "Terraform",
  git: "Git",
  github: "GitHub",
  "github actions": "GitHub Actions",
  cicd: "CI/CD",
  "ci/cd": "CI/CD",
};

/**
 * Normalizes a raw skill string to its canonical name.
 * e.g. "react.js" -> "React", "NodeJS" -> "Node.js"
 */
export function normalizeSkill(skill: string): string {
  if (!skill || typeof skill !== "string") return "";
  const cleaned = skill.trim().toLowerCase();
  if (SKILL_ALIAS_MAP[cleaned]) {
    return SKILL_ALIAS_MAP[cleaned];
  }
  // Capitalize words if not in map
  return skill
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Checks if two skill strings represent the same skill deterministically.
 */
export function areSkillsEquivalent(skillA: string, skillB: string): boolean {
  if (!skillA || !skillB) return false;
  const normA = normalizeSkill(skillA).toLowerCase();
  const normB = normalizeSkill(skillB).toLowerCase();
  if (normA === normB) return true;
  if (normA.includes(normB) || normB.includes(normA)) {
    // Only if length is substantial to avoid false positives e.g. "c" in "css"
    if (Math.min(normA.length, normB.length) >= 3) return true;
  }
  return false;
}

/**
 * Deduplicates and normalizes an array of skills.
 */
export function normalizeSkillList(skills: string[]): string[] {
  if (!Array.isArray(skills)) return [];
  const normalizedSet = new Set<string>();
  for (const s of skills) {
    if (s && typeof s === "string" && s.trim()) {
      normalizedSet.add(normalizeSkill(s));
    }
  }
  return Array.from(normalizedSet);
}
