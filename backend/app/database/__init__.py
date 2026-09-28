# database package — export engine, session, Base, and models
from app.database.base import Base
from app.database.session import engine, SessionLocal, get_db
from app.database import models   # noqa: F401 — ensures models register with Base
