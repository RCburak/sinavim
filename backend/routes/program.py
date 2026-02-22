"""Program ve geçmiş rotaları (FastAPI)."""
from typing import List, Dict, Any
from fastapi import APIRouter
from utils.responses import success_response, error_response
from services.program_service import program_service
from schemas import SaveProgramRequest, ArchiveProgramRequest

program_router = APIRouter()


@program_router.get("/get-program/{user_id}")
def get_program(user_id: str) -> List[Dict[str, Any]]:
    """Kullanıcının aktif programını getirir (frontend uyumluluk için ham array)."""
    rows = program_service.get(user_id)
    return rows


@program_router.post("/save-program")
def save_program(req: SaveProgramRequest):
    """Programı kaydeder."""
    ok, err = program_service.save(req.user_id, req.program)
    if err:
        return error_response(err, 500)
    return success_response(message="Kaydedildi")


@program_router.post("/archive-program")
def archive_program(req: ArchiveProgramRequest):
    """Programı geçmişe arşivler."""
    ok, err = program_service.archive(
        req.user_id,
        req.type,
    )
    if err:
        return error_response(err, 500)
    return success_response()


@program_router.get("/get-history/{user_id}")
def get_history(user_id: str) -> List[Dict[str, Any]]:
    """Kullanıcının program geçmişini getirir (frontend uyumluluk için ham array)."""
    rows = program_service.get_history(user_id)
    return rows


@program_router.delete("/delete-history/{history_id}")
def delete_history(history_id: str):
    """Geçmiş kaydını siler."""
    ok, err = program_service.delete_history(history_id)
    if err:
        return error_response(err, 500)
    return success_response()


@program_router.get("/user-stats/{user_id}")
def get_user_stats(user_id: str) -> Dict[str, Any]:
    """Kullanıcı istatistiklerini getirir (frontend uyumluluk için ham object)."""
    stats = program_service.get_stats(user_id)
    return stats
