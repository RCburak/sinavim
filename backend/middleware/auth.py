"""JWT tabanlı kimlik doğrulama middleware'i."""
import os
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer(auto_error=False)


def create_token(user_id: str, role: str) -> str:
    """JWT token oluşturur."""
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _decode_token(credentials: HTTPAuthorizationCredentials | None) -> dict:
    """Token'ı çözümler ve payload döndürür."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kimlik doğrulama gerekli.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Oturum süresi dolmuş. Lütfen tekrar giriş yapın.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz kimlik bilgisi.",
        )


def verify_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """Herhangi bir geçerli token'ı doğrular. FastAPI Depends olarak kullanılır."""
    return _decode_token(credentials)


def require_teacher(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """Sadece 'teacher' rolüne izin verir."""
    payload = _decode_token(credentials)
    if payload.get("role") != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için öğretmen yetkisi gereklidir.",
        )
    return payload


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """Sadece 'admin' rolüne izin verir."""
    payload = _decode_token(credentials)
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yönetici yetkisi gereklidir.",
        )
    return payload


def require_staff(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """'admin' veya 'teacher' rolüne izin verir."""
    payload = _decode_token(credentials)
    if payload.get("role") not in ["admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yetki gereklidir.",
        )
    return payload
