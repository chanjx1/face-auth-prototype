import psycopg2
from pgvector.psycopg2 import register_vector
import numpy as np

# Database connection settings
# Since your password was empty, we leave it out or use an empty string
DB_CONFIG = {
    "host": "localhost",
    "database": "postgres",
    "user": "postgres",
    "password": "Jx!0531927" 
}

def get_connection():
    conn = psycopg2.connect(**DB_CONFIG)
    register_vector(conn) # This tells Python how to handle the 'vector' type
    return conn

def save_user(username, embedding):
    """Saves a new user and their face vector to Postgres."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (username, face_embedding) VALUES (%s, %s) "
            "ON CONFLICT (username) DO UPDATE SET face_embedding = EXCLUDED.face_embedding",
            (username, embedding)
        )
        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Database Error: {e}")
        return False

def find_nearest_user(live_embedding):
    """Searches the DB for the closest face match."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        # We add '::vector' to explicitly cast the input
        cur.execute(
            "SELECT username, face_embedding <=> %s::vector AS distance FROM users ORDER BY distance LIMIT 1",
            (live_embedding,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        return row 
    except Exception as e:
        print(f"Search Error: {e}")
        return None