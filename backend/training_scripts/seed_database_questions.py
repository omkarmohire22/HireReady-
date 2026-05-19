import sys
import os
import random

# Add backend directory to Python path so we can import database
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.connection import SessionLocal, init_db
from database.models import Question

# ─── ROLES & SKILLS ──────────────────────────────────────────
ROLES = {
    "Frontend Developer": [
        "React", "JavaScript", "TypeScript", "CSS", "Next.js", "Redux", "TailwindCSS", "DOM Manipulation", "Web Performance"
    ],
    "Backend Developer": [
        "Python", "Node.js", "Docker", "PostgreSQL", "MongoDB", "REST API", "FastAPI", "Microservices", "System Design", "Caching"
    ],
    "UI/UX Designer": [
        "Figma", "User Research", "Wireframing", "Prototyping", "Design Systems", "Accessibility", "Information Architecture"
    ]
}

DIFFICULTIES = ["Easy", "Medium", "Hard"]
QTYPES = ["Conceptual", "Scenario", "Design", "Debugging", "Behavioural"]

# ─── EXTENDED QUESTION TEMPLATES ──────────────────────────────────────
TEMPLATES = {
    ("Conceptual", "Easy"): [
        ("What is {skill} and why is it important for a {role}?", ["definition", "use case", "importance"]),
        ("Explain the basic concept of {skill} in simple terms.", ["basics", "core concept", "understanding"]),
        ("What are the main features of {skill}?", ["features", "capabilities", "advantages"]),
        ("Define {skill} and give a basic example.", ["definition", "example", "syntax"]),
    ],
    ("Conceptual", "Medium"): [
        ("What are the trade-offs of using {skill} over alternatives?", ["trade-offs", "pros", "cons", "comparison"]),
        ("Explain how {skill} works under the hood.", ["internals", "architecture", "mechanism"]),
        ("How does {skill} handle {challenge} in a production environment?", ["production", "challenge", "solution"]),
        ("What is the lifecycle or execution flow of {skill}?", ["lifecycle", "execution", "flow", "phases"]),
    ],
    ("Conceptual", "Hard"): [
        ("How does {skill} ensure {property} at scale, and what are its architectural limitations?", ["scalability", "limitations", "architecture"]),
        ("Compare {skill} with its closest alternative in terms of performance and developer experience.", ["comparison", "performance", "DX"]),
        ("Explain the underlying algorithms or patterns used by {skill}.", ["algorithm", "pattern", "internals"]),
    ],
    ("Scenario", "Easy"): [
        ("How would you use {skill} to build a simple {system}?", ["approach", "setup", "basics"]),
        ("If a junior developer asked you to explain {skill}, what real-world analogy would you use?", ["analogy", "teaching", "simplicity"]),
    ],
    ("Scenario", "Medium"): [
        ("You are building a {system} and need to integrate {skill}. Walk me through your approach.", ["integration", "architecture", "planning"]),
        ("How would you use {skill} to handle {challenge} in a real-world application?", ["challenge", "solution", "practical"]),
        ("Your team is migrating an existing system to use {skill}. What is your migration plan?", ["migration", "strategy", "risk mitigation"]),
    ],
    ("Scenario", "Hard"): [
        ("Your {system} is experiencing {failure} at 10x normal traffic. How do you use {skill} to diagnose and resolve it?", ["diagnosis", "resolution", "scaling"]),
        ("You are the lead engineer on a {system} serving 5 million users. How would you architect {skill} into the stack?", ["architecture", "scale", "high availability"]),
    ],
    ("Design", "Easy"): [
        ("Design the basic structure of a todo app using {skill}.", ["structure", "basics", "design"]),
        ("How would you organize files and folders for a project heavily relying on {skill}?", ["organization", "structure", "best practices"]),
    ],
    ("Design", "Medium"): [
        ("Design a {system} that uses {skill} for its core functionality. What components would you include?", ["components", "system design", "architecture"]),
        ("How would you design an application using {skill} that supports 10,000 concurrent users?", ["concurrency", "scaling", "design"]),
    ],
    ("Design", "Hard"): [
        ("Design a highly scalable {system} using {skill} that handles 1 million events per second.", ["high scale", "throughput", "system design"]),
        ("Architect a fault-tolerant deployment of {skill} for a global application with sub-100ms latency requirements.", ["fault tolerance", "latency", "global distribution"]),
    ],
    ("Debugging", "Easy"): [
        ("A basic {skill} setup is failing on startup. What are your first steps to debug?", ["debugging", "startup", "logs"]),
        ("Your {skill} implementation is returning an unexpected null value. Where do you look first?", ["null check", "tracing", "debugging"]),
    ],
    ("Debugging", "Medium"): [
        ("A {skill} application in production is consuming 90% CPU. How do you investigate and resolve this?", ["profiling", "CPU", "optimization"]),
        ("Users are reporting intermittent failures in a feature powered by {skill}. How do you reproduce and fix it?", ["reproduction", "intermittent", "fixing"]),
    ],
    ("Debugging", "Hard"): [
        ("A race condition is occurring in your {skill} setup under load. Describe your complete debugging strategy.", ["race condition", "concurrency", "strategy"]),
        ("Your {skill} deployment is experiencing cascading failures. How do you isolate the root cause?", ["cascading failure", "isolation", "root cause"]),
    ],
    ("Behavioural", "Easy"): [
        ("Tell me about a project where you successfully used {skill}.", ["experience", "project", "success"]),
        ("Describe your experience learning {skill} for the first time.", ["learning", "adaptability", "growth"]),
    ],
    ("Behavioural", "Medium"): [
        ("Describe a challenging problem you solved using {skill}. What was your thought process?", ["problem solving", "thought process", "challenge"]),
        ("Tell me about a time you had to convince your team to adopt {skill}. How did you make the case?", ["persuasion", "leadership", "communication"]),
    ],
    ("Behavioural", "Hard"): [
        ("Tell me about a time {skill} caused a production incident. How did you lead the resolution?", ["incident management", "leadership", "post-mortem"]),
        ("Describe a situation where you had to make a critical architectural decision involving {skill} under tight time pressure.", ["decision making", "pressure", "architecture"]),
    ],
}

FILLERS = {
    "challenge": ["high concurrency", "authentication flow", "state management", "caching invalidation", "cross-browser compatibility", "rate limiting"],
    "system": ["e-commerce platform", "real-time chat app", "notification service", "dashboard interface", "job scheduling system", "user onboarding flow"],
    "failure": ["high latency spikes", "memory leak", "UI freezing", "data corruption", "cascading timeouts"],
    "property": ["eventual consistency", "fault tolerance", "accessibility", "responsive design", "high availability"],
}

def fill_template(template_str, skill, role):
    result = template_str.replace("{skill}", skill).replace("{role}", role)
    for key, options in FILLERS.items():
        if "{" + key + "}" in result:
            result = result.replace("{" + key + "}", random.choice(options))
    return result

def generate_questions(target_count=2000):
    questions_data = []
    
    # We want to generate variations to reach 2000. 
    # Let's do multiple passes with different random fillers.
    pass_number = 1
    while len(questions_data) < target_count:
        for role, skills in ROLES.items():
            for skill in skills:
                for difficulty in DIFFICULTIES:
                    for qtype in QTYPES:
                        key = (qtype, difficulty)
                        templates_for_key = TEMPLATES.get(key, [])
                        if not templates_for_key:
                            continue
                        
                        # Pick a random template
                        tmpl_tuple = random.choice(templates_for_key)
                        tmpl_str = tmpl_tuple[0]
                        expected_keywords = tmpl_tuple[1] + [skill.lower()]
                        
                        question_text = fill_template(tmpl_str, skill, role)
                        
                        # Ensure uniqueness
                        if not any(q['question_text'] == question_text for q in questions_data):
                            questions_data.append({
                                "role": role,
                                "skill": skill,
                                "difficulty": difficulty,
                                "question_type": qtype,
                                "question_text": question_text,
                                "expected_keywords": expected_keywords,
                                "source": "seed_db_script"
                            })
                            
                        if len(questions_data) >= target_count:
                            return questions_data
        pass_number += 1
        # Failsafe
        if pass_number > 20:
            break
            
    return questions_data

def seed_database():
    print("Initializing database tables (if not exist)...")
    init_db()
    
    print("Generating 2,000 high-quality questions...")
    questions = generate_questions(2000)
    print(f"Generated {len(questions)} unique questions.")
    
    print("Inserting into PostgreSQL database...")
    db = SessionLocal()
    
    try:
        # Optional: clear existing seed questions
        # db.query(Question).filter(Question.source == "seed_db_script").delete()
        
        # Batch insert
        objects = []
        for q_data in questions:
            q_obj = Question(**q_data)
            objects.append(q_obj)
            
        db.add_all(objects)
        db.commit()
        print(f"Successfully inserted {len(objects)} questions into the database!")
        
    except Exception as e:
        db.rollback()
        print(f"Error inserting into database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
