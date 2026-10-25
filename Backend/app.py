"""Y_Cohde account API. Run with `python Backend/app.py` from the project root."""
from __future__ import annotations

import os
import secrets
import sqlite3
import sys
from pathlib import Path

from flask import Flask, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
DATABASE = Path(os.environ.get("YCOHDE_DATABASE", BASE_DIR / "database.db"))
ROLES = {"student", "teacher", "administrator"}
DEPARTMENTS = {"basic", "jhs", "shs"}

app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.environ.get("FLASK_SECRET_KEY") or secrets.token_hex(32),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE", "0") == "1",
    PERMANENT_SESSION_LIFETIME=60 * 60 * 24 * 30,
)


def connect_db():
    DATABASE.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    return db


def init_db():
    with connect_db() as db:
        db.execute("""CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            account_type TEXT NOT NULL,
            department TEXT NOT NULL DEFAULT 'basic',
            password TEXT NOT NULL,
            profile_picture TEXT NOT NULL DEFAULT '',
            occupation TEXT NOT NULL DEFAULT '',
            school TEXT NOT NULL DEFAULT ''
        )""")
        # Add profile fields to the earlier prototype database without losing accounts.
        columns = {row[1] for row in db.execute("PRAGMA table_info(users)")}
        for name, definition in (
            ("profile_picture", "TEXT NOT NULL DEFAULT ''"),
            ("occupation", "TEXT NOT NULL DEFAULT ''"),
            ("school", "TEXT NOT NULL DEFAULT ''"),
        ):
            if name not in columns:
                db.execute(f"ALTER TABLE users ADD COLUMN {name} {definition}")


def public_user(user):
    return {
        "id": user["id"], "name": user["full_name"], "full_name": user["full_name"],
        "email": user["email"], "role": user["account_type"],
        "account_type": user["account_type"], "department": user["department"],
        "profilePicture": user["profile_picture"], "occupation": user["occupation"],
        "school": user["school"],
    }


def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    with connect_db() as db:
        return db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def login_user(user):
    session.clear()
    session.permanent = True
    session["user_id"] = user["id"]


@app.post("/api/auth/register")
@app.post("/api/signup")
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("full_name", data.get("name", ""))).strip()
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")
    department = str(data.get("department", "basic")).strip().lower()
    photo = str(data.get("profile_picture", data.get("profilePicture", ""))).strip()
    if not name or len(name) > 120 or "@" not in email or len(email) > 254:
        return jsonify(success=False, message="Enter a valid name and email address."), 400
    if not isinstance(password, str) or len(password) < 8:
        return jsonify(success=False, message="Use a password with at least 8 characters."), 400
    if department not in DEPARTMENTS:
        return jsonify(success=False, message="Choose a valid department."), 400
    # Public self-registration is limited to student accounts. Staff are provisioned by an admin.
    with connect_db() as db:
        try:
            cursor = db.execute(
                "INSERT INTO users (full_name,email,account_type,department,password,profile_picture) VALUES (?,?,?,?,?,?)",
                (name, email, "student", department, generate_password_hash(password), photo),
            )
            user = db.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()
        except sqlite3.IntegrityError:
            return jsonify(success=False, message="An account with this email already exists."), 409
    login_user(user)
    return jsonify(success=True, user=public_user(user)), 201


@app.post("/api/auth/login")
@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")
    requested_role = str(data.get("role", data.get("account_type", ""))).strip().lower()
    if not email or not isinstance(password, str):
        return jsonify(success=False, message="Email and password are required."), 400
    with connect_db() as db:
        user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not user or not check_password_hash(user["password"], password):
        return jsonify(success=False, message="Invalid email or password."), 401
    if requested_role in ROLES and requested_role != user["account_type"]:
        return jsonify(success=False, message="This account does not belong to the selected space."), 403
    login_user(user)
    return jsonify(success=True, user=public_user(user))


@app.get("/api/auth/me")
def whoami():
    user = current_user()
    if not user:
        return jsonify(success=False, message="Not signed in."), 401
    return jsonify(success=True, user=public_user(user))


@app.post("/api/auth/logout")
def logout():
    session.clear()
    return jsonify(success=True)


@app.post("/api/admin/users")
def create_staff_account():
    admin = current_user()
    if not admin or admin["account_type"] != "administrator":
        return jsonify(success=False, message="Administrator access required."), 403
    data = request.get_json(silent=True) or {}
    name = str(data.get("full_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    role = str(data.get("account_type", "")).strip().lower()
    password = data.get("password", "")
    if role not in {"teacher", "administrator"} or not name or "@" not in email:
        return jsonify(success=False, message="Enter a name, valid email, and staff role."), 400
    if not isinstance(password, str) or len(password) < 8:
        return jsonify(success=False, message="Use a password with at least 8 characters."), 400
    with connect_db() as db:
        try:
            cursor = db.execute(
                "INSERT INTO users (full_name,email,account_type,department,password,profile_picture,occupation,school) VALUES (?,?,?,?,?,?,?,?)",
                (name, email, role, "basic", generate_password_hash(password),
                 str(data.get("profile_picture", "")).strip(),
                 str(data.get("occupation", "")).strip(), str(data.get("school", "")).strip()),
            )
            user = db.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()
        except sqlite3.IntegrityError:
            return jsonify(success=False, message="An account with this email already exists."), 409
    return jsonify(success=True, user=public_user(user)), 201


def create_admin():
    import getpass
    name = input("Administrator full name: ").strip()
    email = input("Administrator email: ").strip().lower()
    password = getpass.getpass("Administrator password (8+ characters): ")
    if not name or "@" not in email or len(password) < 8:
        raise SystemExit("A name, valid email, and password of at least 8 characters are required.")
    with connect_db() as db:
        try:
            db.execute(
                "INSERT INTO users (full_name,email,account_type,department,password) VALUES (?,?,?,?,?)",
                (name, email, "administrator", "basic", generate_password_hash(password)),
            )
        except sqlite3.IntegrityError:
            raise SystemExit("That email already has an account.")
    print("Administrator account created.")


init_db()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "create-admin":
        create_admin()
    else:
        app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=False)
