import os
import re
from fastapi import HTTPException
from pdfminer.high_level import extract_text

# ── Keywords that strongly signal a resume/CV ─────────────────────────────
RESUME_SECTION_KEYWORDS = [
    # Core sections
    "experience", "work experience", "professional experience", "employment",
    "education", "academic", "qualification", "degree",
    "skills", "technical skills", "core competencies", "expertise",
    "projects", "internship", "objective", "summary", "profile",
    "certifications", "achievements", "accomplishments", "awards",
    "volunteer", "extracurricular", "languages", "references",
    # Common resume fields
    "curriculum vitae", "resume", "cv", "portfolio",
    "worked at", "responsible for", "led", "developed", "built", "designed",
    "bachelor", "master", "b.tech", "b.e", "m.tech", "mba", "phd", "gpa",
]

# ── Keywords that strongly signal a NON-resume document ────────────────────
NON_RESUME_SIGNALS = [
    "invoice", "purchase order", "receipt", "bill to", "ship to",
    "total amount", "tax invoice", "gst number", "pan number",
    "chapter ", "abstract", "introduction", "conclusion", "bibliography",
    "research paper", "journal", "article", "hypothesis", "methodology",
    "table of contents", "index", "foreword", "preface",
    "company registration", "memorandum", "articles of association",
    "bank statement", "account number", "transaction", "balance",
    "legal notice", "court order", "affidavit", "contract agreement",
    "terms and conditions", "privacy policy",
    "agenda", "minutes of meeting", "attendance",
]

# Expanded skill dictionary for better extraction
SKILLS_DICT = [
    # Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "c", "go",
    "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab",
    # Frontend
    "react", "next.js", "vue", "angular", "html", "css", "tailwind",
    "redux", "graphql", "webpack", "vite", "svelte", "bootstrap",
    # Backend
    "node.js", "fastapi", "django", "flask", "express", "spring boot",
    "asp.net", "laravel", "rails",
    # Databases
    "sql", "postgresql", "mysql", "mongodb", "redis", "sqlite",
    "dynamodb", "cassandra", "firebase", "supabase",
    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
    "ansible", "jenkins", "github actions", "ci/cd", "linux",
    # AI/ML
    "machine learning", "deep learning", "pytorch", "tensorflow",
    "scikit-learn", "pandas", "numpy", "nlp", "bert", "llm",
    # Other tools / core subjects
    "git", "rest api", "microservices", "kafka", "elasticsearch",
    "figma", "jira", "agile", "scrum", "dbms", "oops", "dsa",
    "networking", "operating systems", "algorithms", "data structures",
    "system design", "software engineering", "web development"
]


class ResumeParserService:
    def __init__(self):
        self.skills_dict = SKILLS_DICT

    def extract_text_from_pdf(self, file_path: str) -> str:
        try:
            text = extract_text(file_path)
            text = re.sub(r'\s+', ' ', text).strip()
            return text
        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail=f"Could not read the PDF file. It may be corrupted or encrypted. ({e})"
            )

    def validate_is_resume(self, text: str) -> None:
        """
        Validates that the uploaded document is a resume/CV.
        Raises HTTPException 422 with a clear message if it's not.
        """
        text_lower = text.lower()

        # 1. Check for strong non-resume signals first
        for signal in NON_RESUME_SIGNALS:
            if signal in text_lower:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"This document appears to be a '{signal.title()}', not a resume. "
                        "Please upload your CV or resume in PDF format."
                    )
                )

        # 2. Count how many resume section keywords are present
        matched_sections = [kw for kw in RESUME_SECTION_KEYWORDS if kw in text_lower]
        resume_score = len(matched_sections)

        # Need at least 3 resume-related indicators to pass
        if resume_score < 3:
            raise HTTPException(
                status_code=422,
                detail=(
                    "This document does not appear to be a resume or CV. "
                    "HireReady only accepts professional resumes. "
                    "Please upload a document with sections like Experience, Education, and Skills."
                )
            )

    def extract_skills_with_ner(self, text: str) -> list:
        found_skills = set()
        text_lower = text.lower()

        # 1. Dictionary/Regex matching for known high-quality technical skills
        for skill in self.skills_dict:
            if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
                if skill in ["html", "css", "sql", "aws", "gcp", "nlp", "llm", "cv", "dbms", "oops", "dsa"]:
                    found_skills.add(skill.upper())
                elif skill in ["next.js", "node.js"]:
                    found_skills.add("Next.js" if skill == "next.js" else "Node.js")
                else:
                    found_skills.add(skill.title())

        # 2. spaCy NER with extremely strict quality filters
        NOISE_WORDS = [
            "university", "institute", "college", "school", "board", 
            "certificate", "secondary", "state", "pvt", "ltd", "inc", 
            "simulation", "completed", "projects", "fitmate", "whatsapp",
            "microsoft", "deloitte", "devfolio", "agrohub", "dubssc", "vidyapeeth",
            "mumbai", "dapoli", "ratnagiri", "linkedin", "ssc", "hsc",
            "certifications", "job", "mca", "copilot", "github copilot",
            "resume", "curriculum", "vitae", "work", "experience", "education",
            "personal", "contact", "address", "phone", "email", "hobby", "hobbies",
            "candidate", "evaluator", "interviewer", "company", "client", "pune",
            "maharashtra", "india", "country", "city", "town", "district", "office", "powerpoint", "excel"
        ]

        try:
            import spacy
            nlp = spacy.load("en_core_web_sm")
            doc = nlp(text[:5000])  # Limit to first 5000 chars for performance
            for ent in doc.ents:
                # Completely ignore non-skill/org/product tags or locations/dates
                if ent.label_ in ('GPE', 'LOC', 'DATE', 'TIME', 'MONEY', 'PERCENT', 'CARDINAL', 'ORDINAL', 'QUANTITY'):
                    continue
                
                ent_text = ent.text.strip()
                ent_lower = ent_text.lower()
                
                # Length guards (real skills are between 2 and 25 characters)
                if len(ent_text) < 2 or len(ent_text) > 25:
                    continue
                
                # Check for noise words
                if any(noise in ent_lower for noise in NOISE_WORDS):
                    continue
                
                # Avoid duplicates that only differ by capitalization
                if ent_lower in [s.lower() for s in found_skills]:
                    continue
                
                # Format and add
                found_skills.add(ent_text)
        except Exception:
            pass  # spaCy unavailable, dict fallback already ran

        return sorted(list(found_skills))

    def process_resume(self, file_path: str) -> dict:
        """
        Full pipeline: Extract text → Validate it's a resume → Extract skills.
        """
        raw_text = self.extract_text_from_pdf(file_path)

        if not raw_text or len(raw_text.strip()) < 100:
            raise HTTPException(
                status_code=422,
                detail="The uploaded PDF appears to be empty or unreadable. Please upload a proper resume."
            )

        # Validate before doing anything else
        self.validate_is_resume(raw_text)

        skills = self.extract_skills_with_ner(raw_text)

        return {
            "skills": skills,
            "raw_text_length": len(raw_text),
            "resume_validated": True,
        }
