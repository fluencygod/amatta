from http import HTTPStatus


def test_register_and_login_flow(client):
    # Register new user
    payload = {"email": "user@example.com", "password": "supersecret", "username": "tester"}
    r = client.post("/auth/register", json=payload)
    assert r.status_code == HTTPStatus.CREATED
    data = r.json()
    assert data["email"] == payload["email"]
    assert data["username"] == payload["username"]
    assert "id" in data

    # Duplicate registration should fail
    r2 = client.post("/auth/register", json=payload)
    assert r2.status_code == HTTPStatus.BAD_REQUEST

    # Login with correct credentials
    r3 = client.post("/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert r3.status_code == HTTPStatus.OK
    token = r3.json()
    assert token["token_type"] == "bearer"
    assert isinstance(token["access_token"], str) and token["access_token"]

    # Login with wrong password
    r4 = client.post("/auth/login", json={"email": payload["email"], "password": "wrongpass"})
    assert r4.status_code == HTTPStatus.UNAUTHORIZED


def test_me_with_token(client):
    payload = {"email": "me@example.com", "password": "supersecret"}
    r = client.post("/auth/register", json=payload)
    assert r.status_code == HTTPStatus.CREATED
    # login to get token
    r2 = client.post("/auth/login", json=payload)
    assert r2.status_code == HTTPStatus.OK
    token = r2.json()["access_token"]
    # call /auth/me
    r3 = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r3.status_code == HTTPStatus.OK
    me = r3.json()
    assert me["email"] == payload["email"]
