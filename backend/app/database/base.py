# =========================================================
# NetMine AI — Declarative Base
#
# All ORM models inherit from this Base.
# WHY: SQLAlchemy uses this to track table metadata
#      (column definitions, relationships, indices).
#      When we call Base.metadata.create_all(engine),
#      it reads all registered models and creates tables.
# =========================================================
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Common base class for all ORM models.
    Provides the metadata registry used by create_all().
    """
    pass
