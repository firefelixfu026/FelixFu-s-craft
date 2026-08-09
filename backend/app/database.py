import os
import os
from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://felix_blog:felix_blog_dev@localhost:5432/felix_blog",
)


class Base(DeclarativeBase):
    pass


engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db() -> None:
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_schema_updates()


def _ensure_schema_updates() -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    table_names = inspector.get_table_names()
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    article_columns = {column["name"] for column in inspector.get_columns("articles")} if "articles" in table_names else set()
    comment_columns = {column["name"] for column in inspector.get_columns("comments")} if "comments" in table_names else set()
    with engine.begin() as connection:
        if "password_hash" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
        if "articles" in table_names and "status" not in article_columns:
            connection.execute(text("ALTER TABLE articles ADD COLUMN status VARCHAR(20) DEFAULT 'published' NOT NULL"))
        if "articles" in table_names and "view_count" not in article_columns:
            connection.execute(text("ALTER TABLE articles ADD COLUMN view_count INTEGER DEFAULT 0 NOT NULL"))
        if "articles" in table_names and "cover_url" not in article_columns:
            connection.execute(text("ALTER TABLE articles ADD COLUMN cover_url TEXT"))
        if "articles" in table_names and "category" not in article_columns:
            connection.execute(text("ALTER TABLE articles ADD COLUMN category VARCHAR(80) DEFAULT '学习笔记' NOT NULL"))
        if "articles" in table_names and "note_collection" not in article_columns:
            connection.execute(text("ALTER TABLE articles ADD COLUMN note_collection VARCHAR(120) DEFAULT '' NOT NULL"))
        if "articles" in table_names and "note_path" not in article_columns:
            connection.execute(text("ALTER TABLE articles ADD COLUMN note_path TEXT DEFAULT '' NOT NULL"))
        if "articles" in table_names and "pinned" not in article_columns:
            connection.execute(text("ALTER TABLE articles ADD COLUMN pinned BOOLEAN DEFAULT FALSE NOT NULL"))
        if "articles" in table_names and "created_at" not in article_columns:
            connection.execute(text("ALTER TABLE articles ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL"))
        if "articles" in table_names and "updated_at" not in article_columns:
            connection.execute(text("ALTER TABLE articles ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL"))
        if "comments" in table_names and "status" not in comment_columns:
            connection.execute(text("ALTER TABLE comments ADD COLUMN status VARCHAR(20) DEFAULT 'approved' NOT NULL"))
        if "comments" in table_names and "user_id" not in comment_columns:
            connection.execute(text("ALTER TABLE comments ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL"))
        if "comments" in table_names and "parent_id" not in comment_columns:
            connection.execute(text("ALTER TABLE comments ADD COLUMN parent_id INTEGER REFERENCES comments(id) ON DELETE SET NULL"))

        connection.execute(
            text(
                "CREATE TABLE IF NOT EXISTS schema_migrations ("
                "name VARCHAR(120) PRIMARY KEY, "
                "applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
            )
        )
        reaction_reset_done = connection.execute(
            text("SELECT name FROM schema_migrations WHERE name = 'reset_reactions_v1_2_3'")
        ).first()
        if not reaction_reset_done:
            connection.execute(text("DELETE FROM user_reactions"))
            connection.execute(text("UPDATE reaction_counters SET count = 0"))
            connection.execute(text("INSERT INTO schema_migrations (name) VALUES ('reset_reactions_v1_2_3')"))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
