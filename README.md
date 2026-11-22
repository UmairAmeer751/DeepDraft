# DeepDraft
AI-powered brand-adaptive content generation platform (FYP, COMSATS Lahore).
Team: Zebulun Rafaqat Masih, Umair Ameer Hamza, Muhammad Sohaib Liaqat.

## Running the backend
cd backend
python -m venv .venv
.venv\Scripts\activate          (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env          (macOS/Linux: cp .env.example .env)
uvicorn app.main:app --reload   -> http://localhost:8000/api/health
pytest -q