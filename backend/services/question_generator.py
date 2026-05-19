import os
import csv
import random
from typing import Optional, List

# ── Role name aliases — maps app role names ↔ CSV role names ────────────────
ROLE_ALIASES = {
    # App name → canonical
    "full stack dev":        "Full Stack Developer",
    "full stack developer":  "Full Stack Developer",
    "backend engineer":      "Backend Developer",
    "backend developer":     "Backend Developer",
    "frontend developer":    "Frontend Developer",
    "ml engineer":           "ML Engineer",
    "system design":         "System Design",
    "devops engineer":       "DevOps Engineer",
    "data analyst":          "Data Analyst",
}

def normalize_role(role: str) -> str:
    return ROLE_ALIASES.get(role.strip().lower(), role.strip())

def normalize_difficulty(diff: str) -> str:
    """Normalise difficulty to match CSV values: Easy / Medium / Hard."""
    d = diff.strip().capitalize()
    return d if d in {"Easy", "Medium", "Hard"} else "Medium"

def normalize_session_type(stype: str) -> str:
    """Normalise session type to match CSV values."""
    mapping = {
        "technical":     "technical",
        "behavioural":   "behavioural",
        "behavioral":    "behavioural",
        "system_design": "system_design",
        "system design": "system_design",
    }
    return mapping.get(stype.strip().lower(), "technical")

# ── Curated high-quality question bank (difficulty-tagged) ───────────────────
QUESTION_BANK = {
    # (canonical_role, skill, difficulty)
    ("ML Engineer", "PyTorch", "Hard"): [
        "You are training a deep learning model and the loss is NaN after epoch 3. Walk me through your debugging process.",
        "Explain the difference between nn.DataParallel and DistributedDataParallel. When would you use each?",
        "Design a custom loss function in PyTorch for a multi-label classification problem with class imbalance.",
    ],
    ("ML Engineer", "PyTorch", "Medium"): [
        "How would you optimize a PyTorch model for inference on CPU with limited memory?",
        "Your PyTorch training loop is 3x slower than expected. What profiling tools would you use?",
    ],
    ("ML Engineer", "PyTorch", "Easy"): [
        "What is the difference between a Tensor and a NumPy array in PyTorch?",
        "How do you save and load a PyTorch model?",
    ],
    ("ML Engineer", "Scikit-Learn", "Hard"): [
        "You have a dataset with 40% missing values. What Scikit-Learn preprocessing strategies would you consider?",
        "How would you implement a robust cross-validation pipeline for time-series data?",
    ],
    ("ML Engineer", "Scikit-Learn", "Medium"): [
        "Explain Pipeline and ColumnTransformer in Scikit-Learn with a mixed numeric/categorical dataset.",
        "Your Random Forest classifier is overfitting badly. What hyperparameters would you tune first?",
    ],
    ("ML Engineer", "Scikit-Learn", "Easy"): [
        "What is the difference between fit() and transform() in Scikit-Learn?",
        "How do you handle class imbalance using Scikit-Learn's class_weight parameter?",
    ],
    ("ML Engineer", "Feature Engineering", "Hard"): [
        "How would you encode high-cardinality categorical variables (1000+ categories) effectively?",
        "Explain when target encoding causes data leakage and how to prevent it.",
    ],
    ("ML Engineer", "Feature Engineering", "Medium"): [
        "Given a raw e-commerce transaction dataset, describe the feature engineering steps before modeling.",
        "What temporal features would you engineer from login timestamps for churn prediction?",
    ],
    ("ML Engineer", "Feature Engineering", "Easy"): [
        "What is feature scaling and when is it necessary?",
        "Explain the difference between one-hot encoding and label encoding.",
    ],
    ("ML Engineer", "Model Deployment", "Hard"): [
        "How would you implement A/B testing for two model versions with gradual rollout?",
        "How do you monitor model drift in production? What triggers a rollback?",
    ],
    ("ML Engineer", "Model Deployment", "Medium"): [
        "Walk me through deploying a PyTorch model as a REST API using FastAPI and Docker.",
        "Your ML model in production has latency spikes at peak traffic. How do you diagnose this?",
    ],
    ("ML Engineer", "Model Deployment", "Easy"): [
        "What is the difference between batch inference and real-time inference?",
        "What is model serialization and why is it important for deployment?",
    ],
    ("ML Engineer", "BERT", "Hard"): [
        "Compare BERT, RoBERTa, and DistilBERT. When would you choose each for a production NLP task?",
        "Your BERT fine-tuned model has 95% accuracy on test but 70% in production. What could explain this?",
    ],
    ("ML Engineer", "BERT", "Medium"): [
        "You are fine-tuning BERT for sentiment classification with 500 labeled examples. How do you prevent overfitting?",
        "How would you use BERT embeddings for a semantic search system with 1M documents?",
    ],
    ("ML Engineer", "BERT", "Easy"): [
        "Explain how BERT's masked language modeling pretraining works.",
        "What is tokenization in BERT and why does it matter?",
    ],
    ("Frontend Developer", "React", "Hard"): [
        "Explain React's reconciliation algorithm. How does virtual DOM diffing work with keys?",
        "You have a React component re-rendering 50 times per second. How do you diagnose and fix it?",
        "Design a real-time collaborative editor in React handling concurrent state updates.",
    ],
    ("Frontend Developer", "React", "Medium"): [
        "When would you use useCallback vs useMemo vs React.memo? Give concrete examples.",
        "How would you implement optimistic UI updates in a React app communicating with a REST API?",
    ],
    ("Frontend Developer", "React", "Easy"): [
        "What is the difference between controlled and uncontrolled components in React?",
        "Explain the useState and useEffect hooks with a simple example.",
    ],
    ("Frontend Developer", "TypeScript", "Hard"): [
        "Explain TypeScript's mapped types and conditional types with a real-world example.",
        "How would you use TypeScript generics to build a type-safe API client?",
    ],
    ("Frontend Developer", "TypeScript", "Medium"): [
        "Explain the difference between 'unknown' and 'any' in TypeScript.",
        "You are migrating a large JavaScript codebase to TypeScript. What is your incremental strategy?",
    ],
    ("Frontend Developer", "TypeScript", "Easy"): [
        "What is the difference between an interface and a type alias in TypeScript?",
        "How do you define optional properties in a TypeScript interface?",
    ],
    ("Backend Developer", "Python", "Hard"): [
        "Explain the GIL in Python. How does it affect multithreading vs multiprocessing?",
        "You have a Python service with a memory leak that only appears under load. Walk through your diagnosis.",
    ],
    ("Backend Developer", "Python", "Medium"): [
        "Describe Python's asyncio event loop. How do you avoid blocking it with CPU-bound tasks?",
        "Compare Django ORM vs SQLAlchemy. When would you choose raw SQL over an ORM?",
    ],
    ("Backend Developer", "Python", "Easy"): [
        "What are Python decorators and how do they work?",
        "Explain the difference between a list and a tuple in Python.",
    ],
    ("Backend Developer", "FastAPI", "Hard"): [
        "How do you implement JWT authentication with refresh tokens in FastAPI?",
        "Your FastAPI endpoint takes 4 seconds to respond. Walk through your performance optimization process.",
    ],
    ("Backend Developer", "FastAPI", "Medium"): [
        "Explain FastAPI's dependency injection system and design a database session management pattern.",
        "How do you handle background jobs in FastAPI? Compare BackgroundTasks, Celery, and asyncio.",
    ],
    ("Backend Developer", "FastAPI", "Easy"): [
        "What makes FastAPI faster than Flask for building APIs?",
        "How do you define request validation models in FastAPI using Pydantic?",
    ],
    ("Backend Developer", "Docker", "Hard"): [
        "How do you build a multi-stage Dockerfile that reduces the final image size by 70%?",
        "Your Docker container crashes in production but not locally. How do you debug it systematically?",
    ],
    ("Backend Developer", "Docker", "Medium"): [
        "Design a Docker Compose setup for a microservices app with a database, cache, and message queue.",
        "How do you handle secrets management in Docker without baking credentials into images?",
    ],
    ("Backend Developer", "Docker", "Easy"): [
        "What is the difference between CMD and ENTRYPOINT in a Dockerfile?",
        "What is a Docker volume and why would you use it?",
    ],
    ("Full Stack Developer", "React", "Hard"): [
        "Design a real-time dashboard updating every 500ms using React and WebSockets without excessive re-renders.",
        "Explain React Server Components. How do they differ from Client Components in Next.js App Router?",
    ],
    ("Full Stack Developer", "React", "Medium"): [
        "You are building a large-scale form wizard in React. How do you manage state across 10 steps?",
        "How would you implement code splitting and lazy loading to reduce initial bundle size?",
    ],
    ("Full Stack Developer", "React", "Easy"): [
        "What is the difference between props and state in React?",
        "How does React Router handle client-side navigation?",
    ],
    ("Full Stack Developer", "Node.js", "Hard"): [
        "Your Node.js server is hitting the memory limit under load. How do you profile and fix the leak?",
        "Design a job queue using Bull and Redis for processing 10,000 tasks per minute.",
    ],
    ("Full Stack Developer", "Node.js", "Medium"): [
        "Explain the Node.js event loop phases. What is the difference between setImmediate and process.nextTick?",
        "How do you implement graceful shutdown in a Node.js server handling active connections?",
    ],
    ("Full Stack Developer", "Node.js", "Easy"): [
        "What is npm and how does package.json manage dependencies?",
        "Explain the difference between synchronous and asynchronous code in Node.js.",
    ],
    ("System Design", "Microservices", "Hard"): [
        "Design a ride-sharing system like Uber. Walk through your service decomposition and communication strategy.",
        "Explain the Saga pattern. When would you use choreography vs orchestration for distributed transactions?",
    ],
    ("System Design", "Microservices", "Medium"): [
        "How do you implement distributed tracing across 20 microservices?",
        "Your microservices system has a cascading failure. How do you implement circuit breakers?",
    ],
    ("System Design", "Microservices", "Easy"): [
        "What is the difference between monolithic and microservices architecture?",
        "What is an API gateway and why is it used in microservices?",
    ],
    ("DevOps Engineer", "Kubernetes", "Hard"): [
        "How do you implement zero-downtime deployments using rolling updates and readiness probes?",
        "Design a Kubernetes resource management strategy for a multi-tenant SaaS platform.",
    ],
    ("DevOps Engineer", "Kubernetes", "Medium"): [
        "Your Kubernetes pod is in CrashLoopBackOff. Walk me through your debugging process.",
        "How do you implement horizontal pod autoscaling based on custom metrics?",
    ],
    ("DevOps Engineer", "Kubernetes", "Easy"): [
        "What is the difference between a Pod and a Deployment in Kubernetes?",
        "What is a Kubernetes Service and why is it needed?",
    ],
    ("DevOps Engineer", "Docker", "Hard"): [
        "Design a multi-stage Docker build pipeline for a production microservices app.",
        "How do you implement Docker image security scanning in a CI/CD pipeline?",
    ],
    ("DevOps Engineer", "Docker", "Medium"): [
        "How do you manage Docker container logs in a production environment?",
        "Explain Docker networking modes and when to use each.",
    ],
    ("DevOps Engineer", "Docker", "Easy"): [
        "What is the difference between a Docker image and a container?",
        "How do you expose a port in Docker?",
    ],
    ("DevOps Engineer", "CI/CD", "Hard"): [
        "Design a CI/CD pipeline for a microservices app with 20 services deployed to Kubernetes.",
        "How do you implement blue-green deployment using GitHub Actions and Kubernetes?",
    ],
    ("DevOps Engineer", "CI/CD", "Medium"): [
        "What is the difference between continuous delivery and continuous deployment?",
        "How do you handle secrets securely in a CI/CD pipeline?",
    ],
    ("DevOps Engineer", "CI/CD", "Easy"): [
        "What is CI/CD and why is it important?",
        "What happens in a typical CI pipeline when a pull request is opened?",
    ],

    # ── Next.js Questions ───────────────────
    ("Frontend Developer", "Next.js", "Hard"): [
        "Explain how incremental static regeneration (ISR) works in Next.js. How do you handle stale cache bypass for critical pages?",
        "Compare Next.js App Router nested layouts with Page Router layouts. How do you optimize dynamic routing performance?",
        "Walk me through your optimization strategy for minimizing Largest Contentful Paint (LCP) in a Next.js Server Components environment."
    ],
    ("Frontend Developer", "Next.js", "Medium"): [
        "What is the difference between getServerSideProps, getStaticProps, and dynamic rendering in Next.js Server Components?",
        "How do you implement secure middleware-based route guarding in Next.js using JWTs?",
    ],
    ("Frontend Developer", "Next.js", "Easy"): [
        "What are Next.js API Routes and when would you use them?",
        "Explain the purpose of the Custom Image Component in Next.js and how it optimizes layouts."
    ],

    # ── AWS Cloud Questions ───────────────────
    ("DevOps Engineer", "AWS", "Hard"): [
        "Design a highly available, multi-region architecture on AWS with active-active database replication and failover latency under 10 seconds.",
        "How would you troubleshoot a random 554 Gateway Timeout error occurring on your AWS ALB linked to ECS Fargate containers?",
    ],
    ("DevOps Engineer", "AWS", "Medium"): [
        "Compare AWS Lambda with ECS Fargate in terms of cold starts, scaling limits, and cost profiles.",
        "How do you implement dynamic secret rotation for an RDS Database using AWS Secrets Manager and Lambda?",
    ],
    ("DevOps Engineer", "AWS", "Easy"): [
        "What is the difference between an AWS S3 bucket policy and an IAM policy?",
        "Explain the purpose of an AWS VPC and Security Groups."
    ],

    # ── Terraform Questions ───────────────────
    ("DevOps Engineer", "Terraform", "Hard"): [
        "How do you resolve a state file drift or lock conflict systematically when multiple pipeline runs attempt simultaneous updates?",
        "Explain how custom Terraform Providers are built and how they communicate with target APIs."
    ],
    ("DevOps Engineer", "Terraform", "Medium"): [
        "Explain the concept of Terraform Modules and how you design re-usable modules with complex variable inputs.",
        "What is a Terraform State file and how do you configure remote state locking with S3 and DynamoDB?"
    ],
    ("DevOps Engineer", "Terraform", "Easy"): [
        "What is the difference between terraform plan and terraform apply?",
        "How do you declare and reference local variables in Terraform?"
    ],

    # ── PostgreSQL Questions ───────────────────
    ("Backend Developer", "PostgreSQL", "Hard"): [
        "Explain connection pooling in PostgreSQL. Compare PgBouncer session mode vs transaction mode under high concurrency.",
        "Your PostgreSQL database has high CPU utilization caused by autovacuum blocking queries. How do you tune vacuum parameters?",
        "Design a database schema utilizing PostgreSQL partitioning for a table that grows by 10 million rows daily."
    ],
    ("Backend Developer", "PostgreSQL", "Medium"): [
        "What is the difference between a B-Tree index, a GIN index, and a BRIN index in PostgreSQL? When is each preferred?",
        "How do you identify slow-running SQL queries in PostgreSQL? What metrics do you examine in EXPLAIN ANALYZE?"
    ],
    ("Backend Developer", "PostgreSQL", "Easy"): [
        "Explain the difference between INNER JOIN, LEFT JOIN, and outer joins in SQL.",
        "What is database normalization and what are the benefits of 3NF?"
    ],

    # ── Redis Questions ───────────────────
    ("Backend Developer", "Redis", "Hard"): [
        "Design a distributed rate limiter in Redis that supports sliding-window logging with millisecond precision under high traffic.",
        "Compare Redis Sentinel with Redis Cluster. How is data partitioned and how is failover managed?",
    ],
    ("Backend Developer", "Redis", "Medium"): [
        "Explain Redis persistence models: RDB snapshots vs AOF logs. When would you combine both?",
        "How do you handle Redis cache penetration, stampede, and cache avalanche systematically?"
    ],
    ("Backend Developer", "Redis", "Easy"): [
        "What is the difference between Redis data types: Strings, Hashes, Lists, and Sets?",
        "Explain Redis keying eviction policies and the purpose of TTL."
    ],

    # ── Data Analyst Questions ───────────────────
    ("Data Analyst", "SQL", "Hard"): [
        "Write a SQL window query to calculate a 7-day rolling average of user transaction volumes without using external joins.",
        "Explain the difference between correlated subqueries and CTEs. How do query planners optimize recursive CTEs?"
    ],
    ("Data Analyst", "SQL", "Medium"): [
        "How do you use SQL window functions like ROW_NUMBER(), RANK(), and DENSE_RANK()? When would they yield different results?",
        "What is database indexing and how does it speed up queries at the cost of write performance?"
    ],
    ("Data Analyst", "SQL", "Easy"): [
        "What is the GROUP BY clause and how does it differ from the WHERE clause in SQL?",
        "Explain the purpose of the HAVING clause with a simple example."
    ],
    ("Data Analyst", "Pandas", "Hard"): [
        "Explain how vectorization works in Pandas and why custom apply functions are orders of magnitude slower than native operations.",
        "You need to merge two massive dataframes of 50M rows each under strict RAM limits. What memory optimization strategies would you use?"
    ],
    ("Data Analyst", "Pandas", "Medium"): [
        "Explain the difference between groupby().transform() and groupby().apply() in Pandas.",
        "How do you systematically handle missing or null values in a Pandas DataFrame without losing dataset variance?"
    ],
    ("Data Analyst", "Pandas", "Easy"): [
        "What is the difference between a Series and a DataFrame in Pandas?",
        "How do you select specific columns and rows from a Pandas DataFrame?"
    ],
}


class QuestionGeneratorService:
    def __init__(self):
        self.dataset_questions: dict = {}  # {(canonical_role, skill, difficulty, session_type): [q, ...]}
        self.model = None
        self.tokenizer = None
        self._load_dataset()
        self._load_model()

    # ── 1. Load dataset CSV with difficulty + session_type support ────────────
    def _load_dataset(self):
        csv_path = os.path.join(os.path.dirname(__file__), "..", "dataset", "flan_t5_seed.csv")
        if not os.path.exists(csv_path):
            print("[QuestionGen] Dataset CSV not found — using built-in bank only.")
            return
        try:
            count = 0
            with open(csv_path, newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    role      = normalize_role(row.get("role", "").strip())
                    skill     = row.get("skill", "").strip()
                    diff      = normalize_difficulty(row.get("difficulty", "Medium"))
                    stype     = normalize_session_type(row.get("session_type", "technical"))
                    question  = row.get("output_question", "").strip()
                    if role and skill and question:
                        key = (role, skill, diff, stype)
                        self.dataset_questions.setdefault(key, []).append(question)
                        count += 1
            print(f"[QuestionGen] Loaded {count} questions from CSV dataset.")
        except Exception as e:
            print(f"[QuestionGen] Failed to load dataset: {e}")

    # ── 2. Load FLAN-T5 (lazy) ────────────────────────────────────────────────
    def _load_model(self):
        try:
            from transformers import T5Tokenizer, T5ForConditionalGeneration
            model_path = os.path.join(os.path.dirname(__file__), "..", "ml_models", "question_generator")
            model_name = model_path if os.path.exists(model_path) else "google/flan-t5-small"
            print(f"[QuestionGen] Loading FLAN-T5 from {model_name}...")
            self.tokenizer = T5Tokenizer.from_pretrained(model_name)
            self.model = T5ForConditionalGeneration.from_pretrained(model_name)
            print("[QuestionGen] FLAN-T5 loaded successfully.")
        except Exception as e:
            print(f"[QuestionGen] FLAN-T5 unavailable: {e} — using dataset/bank only.")
            self.model = None
            self.tokenizer = None

    # ── 3. Pick from built-in bank (difficulty-aware) ─────────────────────────
    def _get_from_bank(
        self,
        skill: str,
        role: str,
        difficulty: str,
        exclude: Optional[List[str]] = None,
    ) -> Optional[str]:
        norm_role = normalize_role(role)
        norm_diff = normalize_difficulty(difficulty)
        exclude_set = set(exclude or [])

        # Priority: exact difficulty → adjacent difficulty → any difficulty
        difficulties_to_try = self._difficulty_fallback_order(norm_diff)

        for diff in difficulties_to_try:
            key = (norm_role, skill, diff)
            candidates = [q for q in QUESTION_BANK.get(key, []) if q not in exclude_set]
            if candidates:
                return random.choice(candidates)

        # Fuzzy: try skill match ignoring role
        for (r, s, d), qs in QUESTION_BANK.items():
            if s.lower() == skill.lower() and d == norm_diff:
                candidates = [q for q in qs if q not in exclude_set]
                if candidates:
                    return random.choice(candidates)

        return None

    # ── 4. Pick from CSV dataset (difficulty + session_type aware) ────────────
    def _get_from_csv(
        self,
        skill: str,
        role: str,
        difficulty: str,
        session_type: str,
        exclude: Optional[List[str]] = None,
    ) -> Optional[str]:
        norm_role  = normalize_role(role)
        norm_diff  = normalize_difficulty(difficulty)
        norm_stype = normalize_session_type(session_type)
        exclude_set = set(exclude or [])

        difficulties_to_try = self._difficulty_fallback_order(norm_diff)

        for diff in difficulties_to_try:
            key = (norm_role, skill, diff, norm_stype)
            candidates = [q for q in self.dataset_questions.get(key, []) if q not in exclude_set]
            if candidates:
                return random.choice(candidates)

        # Skill-only fallback across all roles
        for (r, s, d, t), qs in self.dataset_questions.items():
            if s.lower() == skill.lower() and d == norm_diff and t == norm_stype:
                candidates = [q for q in qs if q not in exclude_set]
                if candidates:
                    return random.choice(candidates)

        return None

    # ── 5. FLAN-T5 generation (difficulty-aware) ───────────────────────────────
    def _generate_with_model(
        self,
        skill: str,
        role: str,
        difficulty: str,
        session_type: str,
        exclude: Optional[List[str]] = None,
    ) -> Optional[str]:
        if not self.model or not self.tokenizer:
            return None
        try:
            norm_diff = normalize_difficulty(difficulty)
            norm_stype = normalize_session_type(session_type)

            if norm_stype == "behavioural":
                prompt = (
                    f"Generate a {norm_diff} difficulty behavioural interview question for a {role} "
                    f"about their experience with {skill}. Focus on leadership, conflict, or problem-solving."
                )
            elif norm_stype == "system_design":
                prompt = (
                    f"Generate a {norm_diff} difficulty system design interview question for a {role} "
                    f"focusing on {skill} architecture, scalability, and trade-offs."
                )
            else:
                difficulty_context = {
                    "Easy": "a foundational concept, definition, or basic use case",
                    "Medium": "a practical scenario requiring applied knowledge",
                    "Hard": "a complex production-level problem requiring deep expertise",
                }
                prompt = (
                    f"Generate a {norm_diff} difficulty technical interview question for a {role} about {skill}. "
                    f"The question should cover {difficulty_context.get(norm_diff, 'applied knowledge')}. "
                    f"End with a question mark."
                )

            inputs = self.tokenizer(prompt, return_tensors="pt", max_length=128, truncation=True)
            outputs = self.model.generate(
                inputs.input_ids,
                max_new_tokens=80,
                num_beams=4,
                num_return_sequences=3,
                do_sample=True,
                temperature=0.85,
                no_repeat_ngram_size=3,
            )
            candidates = [self.tokenizer.decode(o, skip_special_tokens=True).strip() for o in outputs]
            exclude_set = set(exclude or [])
            for c in candidates:
                if len(c.split()) >= 8 and c.endswith("?") and c not in exclude_set:
                    return c
            return candidates[0] if candidates else None
        except Exception as e:
            print(f"[QuestionGen] Model generation error: {e}")
            return None

    # ── 6. Template fallback (never fails, difficulty-aware) ───────────────────
    def _template_fallback(self, skill: str, role: str, difficulty: str, session_type: str) -> str:
        norm_diff  = normalize_difficulty(difficulty)
        norm_stype = normalize_session_type(session_type)

        if norm_stype == "behavioural":
            templates = [
                f"Tell me about a time you had to deal with a difficult situation involving {skill} as a {role}. How did you handle it?",
                f"Describe a scenario where your knowledge of {skill} helped your team succeed. What was your specific contribution?",
                f"Tell me about a project where {skill} was a critical component. What challenges did you face?",
            ]
        elif norm_stype == "system_design":
            templates = [
                f"You are designing a high-traffic architecture that relies on {skill}. What scalability concerns would you address as a {role}?",
                f"Explain a {norm_diff} design decision when using {skill} in a distributed system. What are the trade-offs?",
                f"Design a fault-tolerant system using {skill} for a {role}. Walk through your approach.",
            ]
        else:
            # Difficulty-specific technical templates
            if norm_diff == "Easy":
                templates = [
                    f"What is {skill} and why is it important for a {role}?",
                    f"Explain the basic concept of {skill} in simple terms.",
                    f"If a junior developer asked you to explain {skill}, what analogy would you use?",
                ]
            elif norm_diff == "Medium":
                templates = [
                    f"You are building a production system and need to integrate {skill}. Walk me through your approach as a {role}.",
                    f"A junior engineer is struggling with {skill}. How would you explain its core concepts and common pitfalls?",
                    f"What are the common pitfalls when using {skill} and how do you avoid them as a {role}?",
                ]
            else:  # Hard
                templates = [
                    f"You are a {role}. A production issue has been traced to your {skill} implementation. How do you diagnose and resolve it?",
                    f"Design a highly scalable system using {skill} for a {role}. How would you handle 1 million requests per second?",
                    f"Compare {skill} with its closest alternative in terms of performance and scalability. When would you switch?",
                ]

        return random.choice(templates)

    # ── Helper: difficulty fallback order ─────────────────────────────────────
    @staticmethod
    def _difficulty_fallback_order(difficulty: str) -> List[str]:
        """
        Returns a priority list of difficulties to try.
        Always starts with the requested one, then expands to adjacent.
        """
        order = {
            "Easy":   ["Easy", "Medium", "Hard"],
            "Medium": ["Medium", "Easy", "Hard"],
            "Hard":   ["Hard", "Medium", "Easy"],
        }
        return order.get(difficulty, ["Medium", "Easy", "Hard"])

    # ── 7. Public API ─────────────────────────────────────────────────────────
    def generate_question(
        self,
        skill: str,
        role: str,
        exclude: Optional[List[str]] = None,
        difficulty: str = "Medium",
        session_type: str = "technical",
    ) -> dict:
        """
        Priority chain (all difficulty + session_type aware):
        1. Built-in curated bank  (highest quality, difficulty-tagged)
        2. CSV dataset            (800 questions, difficulty + session_type tagged)
        3. FLAN-T5 model          (generated, difficulty-prompted)
        4. Template fallback      (never fails, difficulty-templated)
        """
        question = None

        # 1. Built-in bank (best quality for technical questions)
        question = self._get_from_bank(skill, role, difficulty, exclude)

        # 2. CSV dataset
        if not question:
            question = self._get_from_csv(skill, role, difficulty, session_type, exclude)

        # 3. FLAN-T5
        if not question:
            question = self._generate_with_model(skill, role, difficulty, session_type, exclude)

        # 4. Template fallback
        if not question:
            question = self._template_fallback(skill, role, difficulty, session_type)

        return {
            "status":            "success",
            "skill_targeted":    skill,
            "role_targeted":     role,
            "difficulty":        normalize_difficulty(difficulty),
            "session_type":      normalize_session_type(session_type),
            "generated_question": question,
        }
