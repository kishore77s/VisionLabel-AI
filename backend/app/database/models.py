from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class MediaFile(Base):
    __tablename__ = "media_files"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="pending",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    annotations: Mapped[list["Annotation"]] = relationship(
        back_populates="media",
        cascade="all, delete-orphan",
    )

    description: Mapped[Optional["Description"]] = relationship(
        back_populates="media",
        cascade="all, delete-orphan",
        uselist=False,
    )

    reviews: Mapped[list["Review"]] = relationship(
        back_populates="media",
        cascade="all, delete-orphan",
    )


class Annotation(Base):
    __tablename__ = "annotations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    media_id: Mapped[str] = mapped_column(
        ForeignKey("media_files.id"),
        nullable=False,
        index=True,
    )

    label: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    confidence: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    x1: Mapped[float] = mapped_column(Float, nullable=False)
    y1: Mapped[float] = mapped_column(Float, nullable=False)
    x2: Mapped[float] = mapped_column(Float, nullable=False)
    y2: Mapped[float] = mapped_column(Float, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    media: Mapped["MediaFile"] = relationship(
        back_populates="annotations",
    )


class Description(Base):
    __tablename__ = "descriptions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    media_id: Mapped[str] = mapped_column(
        ForeignKey("media_files.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    ai_description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    human_description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    model: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    media: Mapped["MediaFile"] = relationship(
        back_populates="description",
    )


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    media_id: Mapped[str] = mapped_column(
        ForeignKey("media_files.id"),
        nullable=False,
        index=True,
    )

    reviewer: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    approved: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )

    feedback: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    description_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    object_accuracy: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    overall_quality_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    media: Mapped["MediaFile"] = relationship(
        back_populates="reviews",
    )