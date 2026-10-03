import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Lê do ambiente (docker-compose) ou usa um padrão para rodar local
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://root:rootpassword@localhost:5433/cocapec"
)

# pool_pre_ping evita erro de conexão "morta" quando o Postgres do compose reinicia
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
