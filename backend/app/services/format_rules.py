PLATFORM_RULES = {
    "x": {"hard_max_chars": 280, "max_hashtags": 3},
    "linkedin": {"hard_max_chars": 3000, "target_chars": (300, 1300), "max_hashtags": 5},
    "instagram": {"hard_max_chars": 2200, "max_hashtags": 15},
}


def describe_rules(platform: str) -> str:
    """Return a human-readable rule summary line for the given platform."""
    rules = PLATFORM_RULES[platform]
    line = (
        f"- {platform}: max {rules['hard_max_chars']} characters including hashtags; "
        f"max {rules['max_hashtags']} hashtags"
    )
    if "target_chars" in rules:
        low, high = rules["target_chars"]
        line += f"; aim for {low}-{high} characters"
    return line
