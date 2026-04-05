import pandas as pd
import itertools, random, os

# ─── CONFIG ──────────────────────────────────────────────────
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── ROLES & SKILLS ──────────────────────────────────────────
SKILLS_BY_ROLE = {
    "Frontend Developer":  ["React", "JavaScript", "TypeScript", "CSS", "Next.js", "Redux", "HTML5", "Webpack", "Vue.js"],
    "Backend Developer":   ["Python", "Node.js", "Docker", "Redis", "PostgreSQL", "MongoDB", "REST API", "FastAPI", "Django", "Kafka", "RabbitMQ"],
    "Full Stack Developer":["React", "Node.js", "MongoDB", "Docker", "GraphQL", "Next.js", "TypeScript"],
    "Data Analyst":        ["Python", "SQL", "Pandas", "NumPy", "Tableau", "Power BI", "Statistics", "Excel"],
    "DevOps Engineer":     ["Docker", "Kubernetes", "CI/CD", "Linux", "Terraform", "AWS", "Jenkins", "Ansible"],
    "ML Engineer":         ["Python", "TensorFlow", "PyTorch", "scikit-learn", "BERT", "Feature Engineering", "Model Deployment", "MLflow"],
}

DIFFICULTIES  = ["Easy", "Medium", "Hard"]
QTYPES        = ["Conceptual", "Scenario", "Design", "Debugging", "Behavioural"]

# ─── QUESTION TEMPLATES ──────────────────────────────────────
TEMPLATES = {
    ("Conceptual", "Easy"): [
        "What is {skill} and why is it important for a {role}?",
        "Explain the basic concept of {skill} in simple terms.",
        "What are the main features of {skill}?",
        "Define {skill} and its primary use case.",
        "What problem does {skill} solve in software development?",
    ],
    ("Conceptual", "Medium"): [
        "What are the trade-offs of using {skill} over alternatives?",
        "Explain how {skill} works under the hood.",
        "How does {skill} handle {challenge} in a production environment?",
        "What are common pitfalls when using {skill} and how do you avoid them?",
    ],
    ("Conceptual", "Hard"): [
        "How does {skill} ensure {property} at scale, and what are its architectural limitations?",
        "Compare {skill} with its closest alternative in terms of performance, scalability, and developer experience.",
        "What are the internal memory management strategies used by {skill}?",
    ],
    ("Scenario", "Easy"): [
        "How would you use {skill} to build a simple {system}?",
        "If a junior developer asked you to explain {skill}, what real-world analogy would you use?",
        "You are starting a new {role} project. Why would you choose {skill}?",
    ],
    ("Scenario", "Medium"): [
        "You are building a {system} and need to integrate {skill}. Walk me through your approach.",
        "How would you use {skill} to handle {challenge} in a real-world application?",
        "Your team is migrating an existing system to use {skill}. What is your migration plan?",
    ],
    ("Scenario", "Hard"): [
        "Your {system} is experiencing {failure} at 10x normal traffic. How do you use {skill} to diagnose and resolve it?",
        "You are the lead engineer on a {system} serving 5 million users. How would you architect {skill} into the stack?",
        "A critical deadline is approaching and {skill} is causing unexpected {failure}. How do you manage the situation?",
    ],
    ("Design", "Easy"): [
        "Design a simple todo app using {skill} as the core technology.",
        "How would you structure a basic project using {skill}?",
    ],
    ("Design", "Medium"): [
        "Design a {system} that uses {skill} for {purpose}. What components would you include?",
        "How would you design a RESTful API using {skill} that supports 10,000 concurrent users?",
        "Design the database schema for a {system} that uses {skill} as its data layer.",
    ],
    ("Design", "Hard"): [
        "Design a highly scalable {system} using {skill} that handles 1 million events per second.",
        "Architect a fault-tolerant {system} using {skill}. How do you handle failures without data loss?",
        "Design a multi-region deployment of {skill} for a global application with sub-100ms latency requirements.",
    ],
    ("Debugging", "Easy"): [
        "A basic {skill} function is returning None unexpectedly. How do you debug it?",
        "Your {skill} application is throwing an unhandled error on startup. What are your first steps?",
    ],
    ("Debugging", "Medium"): [
        "A {skill} application in production is consuming 90% CPU. How do you investigate and resolve this?",
        "Users are reporting intermittent failures in a {skill} service. How do you reproduce and fix the issue?",
        "A memory leak is suspected in your {skill} application. How do you confirm and eliminate it?",
    ],
    ("Debugging", "Hard"): [
        "A race condition is occurring in your {skill} setup under load. Describe your complete debugging and resolution strategy.",
        "Your {skill} deployment is experiencing cascading failures across microservices. How do you isolate the root cause?",
        "A deadlock is occurring in your {skill} database layer during peak traffic. How do you detect, resolve, and prevent this?",
    ],
    ("Behavioural", "Easy"): [
        "Tell me about a project where you used {skill}.",
        "Describe your experience learning {skill} for the first time.",
    ],
    ("Behavioural", "Medium"): [
        "Describe a challenging bug you solved using {skill}. What was your thought process?",
        "Tell me about a time you had to convince your team to adopt {skill}. How did you make the case?",
    ],
    ("Behavioural", "Hard"): [
        "Tell me about a time {skill} caused a production incident that affected users. How did you lead the resolution, and what did you change afterwards?",
        "Describe a situation where you had to make a critical architectural decision involving {skill} under tight time pressure.",
    ],
}

FILLERS = {
    "challenge": ["high concurrency", "authentication at scale", "real-time data consistency", "caching invalidation", "rate limiting"],
    "system":    ["e-commerce platform", "real-time chat app", "notification service", "URL shortener", "job scheduling system", "analytics dashboard"],
    "purpose":   ["caching", "session management", "message queuing", "full-text search", "audit logging"],
    "failure":   ["high latency spikes", "connection pool exhaustion", "memory leak", "data corruption", "cascading timeouts"],
    "property":  ["eventual consistency", "fault tolerance", "horizontal scalability", "high availability", "low read latency"],
}

def fill(template, skill, role):
    result = template.replace("{skill}", skill).replace("{role}", role)
    for key, options in FILLERS.items():
        if "{" + key + "}" in result:
            result = result.replace("{" + key + "}", random.choice(options))
    return result

def build_prompt(role, skill, difficulty, qtype):
    return f"Generate a {difficulty} {qtype} question for a {role} focusing on {skill}"

# ─── GENERATE ────────────────────────────────────────────────
rows = []
for role, skills in SKILLS_BY_ROLE.items():
    for skill in skills:
        for difficulty in DIFFICULTIES:
            for qtype in QTYPES:
                key = (qtype, difficulty)
                templates_for_key = TEMPLATES.get(key, [])
                if not templates_for_key:
                    continue
                # Pick 2 templates per combination for variety
                chosen = random.sample(templates_for_key, min(2, len(templates_for_key)))
                for tmpl in chosen:
                    question = fill(tmpl, skill, role)
                    rows.append({
                        "role":            role,
                        "skill":           skill,
                        "difficulty":      difficulty,
                        "question_type":   qtype,
                        "input_prompt":    build_prompt(role, skill, difficulty, qtype),
                        "output_question": question,
                        "source":          "template",
                    })

df = pd.DataFrame(rows)
df.drop_duplicates(subset=["output_question"], inplace=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

out_path = os.path.join(OUTPUT_DIR, "flan_t5_seed.csv")
df.to_csv(out_path, index=False)
print(f"✅ Generated {len(df)} seed rows → {out_path}")
print(df[["role", "skill", "difficulty", "question_type"]].head(10))
