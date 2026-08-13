import re


def normalize_text(text: str) -> set[str]:
    """
    Convert text into a set of normalized words.
    """

    words = re.findall(r"\b[a-zA-Z0-9]+\b", text.lower())

    stop_words = {
        "a",
        "an",
        "the",
        "is",
        "are",
        "was",
        "were",
        "at",
        "to",
        "of",
        "and",
        "in",
        "on",
        "with",
        "near",
        "while",
        "this",
        "that",
    }

    return {
        word
        for word in words
        if word not in stop_words
    }


def calculate_description_score(
    ai_description: str,
    human_description: str
) -> float:

    ai_words = normalize_text(ai_description)
    human_words = normalize_text(human_description)

    if not ai_words or not human_words:
        return 0.0

    intersection = ai_words.intersection(human_words)
    union = ai_words.union(human_words)

    score = len(intersection) / len(union)

    return round(score * 100, 2)


def calculate_quality_score(
    description_score: float,
    object_accuracy: float,
    review_score: float
) -> float:

    overall = (
        description_score * 0.4
        + object_accuracy * 0.4
        + review_score * 0.2
    )

    return round(overall, 2)

def calculate_object_accuracy(
    ai_objects: list[str],
    human_objects: list[str]
) -> float:

    ai_set = {
        obj.lower().strip()
        for obj in ai_objects
    }

    human_set = {
        obj.lower().strip()
        for obj in human_objects
    }

    if not human_set:
        return 100.0 if not ai_set else 0.0

    correct_objects = ai_set.intersection(human_set)

    accuracy = (
        len(correct_objects)
        / len(human_set)
    )

    return round(accuracy * 100, 2)