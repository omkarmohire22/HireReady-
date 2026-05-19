import pandas as pd
import re
import argparse
from pathlib import Path

def clean_text(text):
    """Clean the question text by fixing whitespace and basic punctuation without losing case."""
    text = str(text)
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Remove quotes at start and end if they exist
    if text.startswith('"') and text.endswith('"'):
        text = text[1:-1].strip()
        
    return text

def clean_dataset(input_file: str, output_file: str):
    """
    Cleans a dataset of questions and formats it for FLAN-T5 training.
    """
    print(f"Loading dataset from: {input_file}")
    
    # 1. Load dataset
    try:
        df = pd.read_csv(input_file)
    except FileNotFoundError:
        print(f"Error: Could not find '{input_file}'.")
        return

    initial_len = len(df)
    
    # 2. Remove duplicate rows
    df = df.drop_duplicates()

    # 3. Identify correct column names based on the seed file
    if "output_question" in df.columns:
        question_col = "output_question"
    elif "question" in df.columns:
        question_col = "question"
    else:
        print(f"Error: Could not find the question column. Available columns: {list(df.columns)}")
        return

    # 4. Remove rows with missing important fields
    df = df.dropna(subset=[question_col])

    # 5. Clean text
    df[question_col] = df[question_col].apply(clean_text)
    
    if "input_prompt" in df.columns:
        df["input_prompt"] = df["input_prompt"].apply(clean_text)

    # 6. Normalize fields if they exist
    if "role" in df.columns:
        df["role"] = df["role"].str.title()
    if "difficulty" in df.columns:
        df["difficulty"] = df["difficulty"].str.capitalize()
    if "skill" in df.columns:
        df["skill"] = df["skill"].str.strip() # Keep original case for skills like 'React', 'MongoDB'

    # 7. Remove very short / low-quality questions
    df = df[df[question_col].str.len() > 15]

    # 8. Create input-output format for FLAN-T5
    if "input_prompt" in df.columns and question_col == "output_question":
        # Already correct
        pass
    else:
        if all(col in df.columns for col in ["role", "skill", "difficulty"]):
            # Align the training prompt EXACTLY with the backend inference prompt
            def build_prompt(row):
                session_type = str(row.get("session_type", "technical")).lower()
                diff = row["difficulty"]
                role = row["role"]
                skill = row["skill"]
                
                if session_type == "behavioural":
                    return f"Generate a {diff} behavioural interview question for a {role} about their past experience with {skill}. Focus on leadership, conflict, or problem-solving. End with a question mark."
                elif session_type == "system_design":
                    return f"Generate a {diff} system design interview question for a {role} focusing on {skill} architecture, scalability, and system trade-offs. End with a question mark."
                else:
                    return f"Generate a {diff} technical interview question for a {role} about {skill}. The question should be scenario-based and require deep technical knowledge. End with a question mark."
            
            df["input_prompt"] = df.apply(build_prompt, axis=1)
            df["output_question"] = df[question_col]

    # 9. Keep only required columns
    if "input_prompt" in df.columns and "output_question" in df.columns:
        cleaned_df = df[["input_prompt", "output_question"]]
    else:
        cleaned_df = df

    # 10. Split into train and val
    train_df = cleaned_df.sample(frac=0.8, random_state=42)
    val_df = cleaned_df.drop(train_df.index)

    # 11. Save
    train_file = output_file.replace(".csv", "_train.csv") if "curated" not in output_file else output_file.replace("curated", "train")
    val_file = output_file.replace(".csv", "_val.csv") if "curated" not in output_file else output_file.replace("curated", "val")
    
    train_df.to_csv(train_file, index=False)
    val_df.to_csv(val_file, index=False)

    print(f"Data cleaning and splitting completed.")
    print(f"Total rows: {len(cleaned_df)} | Train: {len(train_df)} | Val: {len(val_df)}")
    print(f"Saved to: {train_file} and {val_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clean Interview Questions Dataset for FLAN-T5")
    parser.add_argument("--input", type=str, default="flan_t5_seed.csv", help="Path to raw dataset")
    parser.add_argument("--output", type=str, default="flan_t5_curated.csv", help="Path to output cleaned dataset")
    
    args = parser.parse_args()
    clean_dataset(args.input, args.output)
