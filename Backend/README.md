# Y_Cohde Python account backend

The Flask API stores accounts in `Backend/database.db` and hashes passwords before saving them. The browser only keeps a small account profile for displaying the current user; password checks and the login session are handled by the server. Existing rows in the earlier database are preserved when the new profile fields are added.

## Run locally

From the project root, install the packages listed in `requirements.txt` and start Flask:

```powershell
python -m pip install -r requirements.txt
python Backend/app.py
```

Open `http://127.0.0.1:5000`. The Flask app serves the existing website and its API on the same origin, so its login cookie works with the pages. Do not open the HTML directly as a `file://` URL when using accounts.

## Accounts

- Students can create their own accounts from the login page. They can use an image URL or upload a JPG, PNG, WebP, or GIF (up to 5 MB); the saved photo appears in the profile pill. Uploaded photos are stored under `Backend/uploads`.
- Teachers and administrators sign in with accounts created by an administrator.
- To create the first administrator, run `python Backend/app.py create-admin` from the project root. The command asks for the name, email, and password without displaying the password. After signing in as that administrator, staff accounts can be provisioned with the administrator-only `POST /api/admin/users` endpoint.
- Accounts and password hashes persist in `Backend/database.db`. Keep a backup of this file.

For a hosted deployment, run the Flask application on a Python-capable host, set a long random `FLASK_SECRET_KEY` in the host's environment, and set `COOKIE_SECURE=1` when HTTPS is enabled. The checked-in `database.db` is part of this project and can contain existing data; use an appropriate private persistent database location and protect backups when deploying real student accounts. Static-only hosts such as GitHub Pages cannot run this Python backend.
