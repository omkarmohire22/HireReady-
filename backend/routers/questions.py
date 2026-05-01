from fastapi import APIRouter, HTTPException
import pandas as pd
import os
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/questions",
    tags=["Questions (Admin)"]
)

class SeedRequest(BaseModel):
    csv_filename: str = "flan_t5_curated.csv"

@router.post("/seed")
async def seed_questions_from_csv(request: SeedRequest):
    """
    Validates that the question CSV file exists and returns row count.
    Questions are served dynamically by QuestionGeneratorService — no DB storage needed.
    """
    csv_path = os.path.join(os.path.dirname(__file__), "..", "dataset", request.csv_filename)

    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail=f"CSV file '{request.csv_filename}' not found.")

    try:
        df = pd.read_csv(csv_path)
        return {
            "status": "ok",
            "message": f"Question bank '{request.csv_filename}' is valid.",
            "total_questions": len(df),
            "columns": list(df.columns),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV: {str(e)}")


router = APIRouter(
    prefix="/api/questions",
    tags=["Questions (Admin)"]
)

class SeedRequest(BaseModel):
    csv_filename: str = "flan_t5_curated.csv"

@router.post("/seed")
async def seed_questions_from_csv(request: SeedRequest):
    """
    Seeds the MongoDB 'questions' collection using a CSV file from the dataset folder.
    Use this to bulk-load approved questions into the DB.
    """
    csv_path = os.path.join(os.path.dirname(__file__), "..", "dataset", request.csv_filename)
    
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail=f"CSV file '{request.csv_filename}' not found.")
        
    try:
        df = pd.read_csv(csv_path)
        
        inserted_count = 0
        for _, row in df.iterrows():
            question_doc = {
                "role": row.get("role", "General"),
                "skill": row.get("skill", "General"),
                "difficulty": row.get("difficulty", "Medium"),
                "question_type": row.get("question_type", "Scenario"),
                "question_text": str(row.get("output_question", "")).strip(),
                "source": row.get("source", "csv_import"),
                "approved": True,
                "tags": []
            }
            
            # Simple deduplication
            existing = questions_col.find_one({
                "question_text": question_doc["question_text"]
            })
            
            if not existing and question_doc["question_text"]:
                questions_col.insert_one(question_doc)
                inserted_count += 1
                
        return {"status": "success", "message": f"Successfully imported {inserted_count} new questions."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")
