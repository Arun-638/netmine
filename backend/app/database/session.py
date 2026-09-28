# =========================================================
# NetMine AI — Database Session Manager
#
# HOW SQLALCHEMY WORKS (brief):
#   Engine   = the connection to the DB file (netmine.db)
#   Session  = a "unit of work" — all queries in one session
#              are atomic (commit/rollback together).
#   get_db() = FastAPI dependency injection pattern.
#              Each HTTP request gets its own session,
#              which is closed automatically when done.
#
# To switch to PostgreSQL later:
#   Change DATABASE_URL in .env to:
#   postgresql+psycopg2://user:pass@host/dbname
# =========================================================
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from app.core.config import settings

# ── Engine ─────────────────────────────────────────────────
# connect_args={"check_same_thread": False}
#   Required for SQLite only — allows the same connection to
#   be used across multiple threads (FastAPI is async/threaded).
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=settings.DEBUG,       # prints SQL in console when DEBUG=True
    pool_pre_ping=True,        # validate connections before use
)

# Enable WAL mode for SQLite — better concurrent read performance
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, _connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# ── Session factory ────────────────────────────────────────
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ── Dependency for FastAPI routes ──────────────────────────
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session per request.

    Usage in a route:
        @router.get("/")
        def my_route(db: Session = Depends(get_db)):
            return db.query(TrafficFlowDB).all()

    The session is automatically closed after the request,
    even if an exception occurs.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
