"""İstek doğrulama yardımcıları."""
from errors import ValidationError


def require_keys(data: dict, keys: list) -> None:
    """Gerekli anahtarların varlığını kontrol eder."""
    missing = [k for k in keys if not data.get(k)]
    if missing:
        raise ValidationError(f"Eksik alanlar: {', '.join(missing)}")
