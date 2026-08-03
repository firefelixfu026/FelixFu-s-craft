from sqlalchemy import select
from sqlalchemy.orm import Session

from app.legacy_notes import LEGACY_NOTE_ARTICLES
from app.models import Article, ReactionCounter, Tag


SEED_ARTICLES = []

DEPRECATED_SAMPLE_ARTICLE_IDS = {
    "react-fastapi-mvp",
    "running-and-study",
    "ai-digest-plan",
}

ALL_SEED_ARTICLES = [*SEED_ARTICLES, *LEGACY_NOTE_ARTICLES]

REACTION_TYPES = ["like", "favorite", "downvote", "question"]

LEGACY_CONTENT_REPLACEMENTS = {
    "https://zju-xlab.feishu.cn/space/api/box/stream/download/asynccode/?code=ZTBlNjU5NTZiZjY5OWUwOGQ1YThkMjM0MGNkMjRlZGNfSDZyVGFGMktvWmVaczlQQU5RVGFSU0N4OXhTeGFjenFfVG9rZW46Rmx0Q2JsQ2xnb0JoTGh4bHpCNWM0bUY3bkpnXzE3Nzc1MTgyNDA6MTc3NzUyMTg0MF9WNA": "/articles/git-workflow.svg",
}

DEFAULT_COVER_URLS = {
    "legacy-note-git": "/articles/git-workflow.svg",
}


def seed_database(db: Session) -> None:
    has_changes = False
    deprecated_articles = db.scalars(
        select(Article).where(Article.id.in_(DEPRECATED_SAMPLE_ARTICLE_IDS))
    ).all()
    for article in deprecated_articles:
        db.delete(article)
        has_changes = True

    for item in ALL_SEED_ARTICLES:
        existing_article = db.get(Article, item["id"])
        if existing_article:
            normalized_content = _normalize_seed_content(existing_article.content or "")
            if normalized_content != existing_article.content:
                existing_article.content = normalized_content
                has_changes = True
            if not existing_article.cover_url and _default_cover_url(item):
                existing_article.cover_url = _default_cover_url(item)
                has_changes = True
            continue

        article = Article(
            id=item["id"],
            title=item["title"],
            summary=item["summary"],
            content=_normalize_seed_content(item["content"]),
            cover_url=_default_cover_url(item),
            date=item["date"],
            read_time=item["read_time"],
            status=item.get("status", "published"),
        )
        article.tags = [_get_or_create_tag(db, tag_name) for tag_name in item["tags"]]
        article.reactions = [
            ReactionCounter(reaction_type=reaction_type, count=0)
            for reaction_type in REACTION_TYPES
        ]
        db.add(article)
        has_changes = True

    if has_changes:
        db.commit()


def _normalize_seed_content(content: str) -> str:
    for old_value, new_value in LEGACY_CONTENT_REPLACEMENTS.items():
        content = content.replace(old_value, new_value)
    return content


def _default_cover_url(item: dict) -> str | None:
    return item.get("cover_url") or DEFAULT_COVER_URLS.get(item["id"])


def _get_or_create_tag(db: Session, name: str) -> Tag:
    tag = db.scalar(select(Tag).where(Tag.name == name))
    if tag:
        return tag

    tag = Tag(name=name)
    db.add(tag)
    db.flush()
    return tag
