from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash


DATABASE = "database.db"

app = Flask(__name__)
CORS(app)


def get_db_connection():
    """Return a SQLite connection whose rows can be accessed by column name."""
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    """Create the users table the first time the application starts."""
    connection = get_db_connection()
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            account_type TEXT NOT NULL,
            department TEXT NOT NULL,
            password TEXT NOT NULL
        )
        """
    )
    connection.commit()
    connection.close()


@app.post("/api/signup")
def signup():
    data = request.get_json(silent=True) or {}

    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    account_type = data.get("account_type", "").strip()
    department = data.get("department", "").strip()
    password = data.get("password", "")

    if not all([full_name, email, account_type, department, password]):
        return jsonify({"success": False, "message": "All fields are required."}), 400

    connection = get_db_connection()
    existing_user = connection.execute(
        "SELECT id FROM users WHERE email = ?", (email,)
    ).fetchone()

    if existing_user:
        connection.close()
        return jsonify({"success": False, "message": "An account with this email already exists."}), 409

    connection.execute(
        """
        INSERT INTO users (full_name, email, account_type, department, password)
        VALUES (?, ?, ?, ?, ?)
        """,
        (full_name, email, account_type, department, generate_password_hash(password)),
    )
    connection.commit()
    connection.close()

    return jsonify({"success": True, "message": "User registered successfully."}), 201


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required."}), 400

    connection = get_db_connection()
    user = connection.execute(
        "SELECT id, full_name, email, account_type, department, password FROM users WHERE email = ?",
        (email,),
    ).fetchone()
    connection.close()

    if user is None or not check_password_hash(user["password"], password):
        return jsonify({"success": False, "message": "Invalid email or password."}), 401

    return jsonify(
        {
            "success": True,
            "message": "Login successful.",
            "user": {
                "id": user["id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "account_type": user["account_type"],
                "department": user["department"],
            },
        }
    )


init_db()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
