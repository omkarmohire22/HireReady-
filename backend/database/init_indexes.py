from database.connection import users_col, sessions_col, questions_col

def init_db_indexes():
    """
    Creates necessary MongoDB indexes for performance and constraints.
    Called once during app startup.
    """
    print("Setting up MongoDB indexes...")
    
    # Users: email must be unique
    users_col.create_index("email", unique=True)
    
    # Sessions: fast lookup by user, sorted by newest first
    sessions_col.create_index([("user_id", 1), ("started_at", -1)])
    
    # Questions: search by role, skill, and difficulty
    questions_col.create_index([("role", 1), ("skill", 1), ("difficulty", 1)])
    questions_col.create_index("approved")
    
    print("MongoDB indexes created successfully.")
