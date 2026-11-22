from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.db import get_db

client = TestClient(app)


def test_health_success():
    mock_db = MagicMock()
    mock_db.execute.return_value = None

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "db": "ok"}
    finally:
        app.dependency_overrides.clear()


def test_health_db_unavailable():
    mock_db = MagicMock()
    mock_db.execute.side_effect = Exception("DB error")

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "db": "unavailable"}
    finally:
        app.dependency_overrides.clear()
