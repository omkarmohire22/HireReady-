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
        df["input"] = df["input_prompt"]
        df["output"] = df[question_col]
    else:
        if all(col in df.columns for col in ["role", "skill", "difficulty"]):
            df["input"] = "Generate a " + df["difficulty"] + " question for a " + df["role"] + " focusing on " + df["skill"]
            df["output"] = df[question_col]

    # 9. Keep only required columns
    if "input" in df.columns and "output" in df.columns:
        cleaned_df = df[["input", "output"]]
    else:
        cleaned_df = df

    # 10. Save cleaned dataset
    cleaned_df.to_csv(output_file, index=False)

    print(f"Data cleaning completed.")
    print(f"Initial rows: {initial_len} -> Cleaned rows: {len(cleaned_df)}")
    print(f"Clean dataset saved to: {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clean Interview Questions Dataset for FLAN-T5")
    parser.add_argument("--input", type=str, default="flan_t5_seed.csv", help="Path to raw dataset")
    parser.add_argument("--output", type=str, default="flan_t5_curated.csv", help="Path to output cleaned dataset")
    
    args = parser.parse_args()
    clean_dataset(args.input, args.output)
