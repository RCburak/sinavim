"""Deneme analizi ve AI yorum rotaları (FastAPI)."""
from typing import List, Dict, Any
from fastapi import APIRouter
from utils.responses import success_response, error_response
from services.analiz_service import analiz_service
from schemas import AddAnalizRequest

analiz_router = APIRouter()


@analiz_router.get("/analizler/{user_id}")
def get_analizler(user_id: str) -> List[Dict[str, Any]]:
    """Kullanıcının deneme sonuçlarını getirir (frontend uyumluluk için ham array)."""
    rows = analiz_service.get_all(user_id)
    return rows


@analiz_router.post("/analiz-ekle")
def analiz_ekle(req: AddAnalizRequest):
    """Yeni analiz ekler."""
    ok, err = analiz_service.add(req.user_id, req.ad, req.net, req.type, req.date)
    if err:
        return error_response(err, 500)
    return success_response(message="Eklendi", status_code=201)


@analiz_router.delete("/analiz-sil/{analiz_id}")
def analiz_sil(analiz_id: str, user_id: str):
    """Analizi siler."""
    ok, err = analiz_service.delete(user_id, analiz_id)
    if err:
        return error_response(err, 500)
    return success_response()


@analiz_router.get("/ai-yorumla/{user_id}")
def ai_yorumla(user_id: str) -> Dict[str, Any]:
    """AI ile deneme yorumu üretir (frontend uyumluluk için ham object)."""
    try:
        yorum = analiz_service.get_ai_yorum(user_id)
        return {"yorum": yorum}
    except Exception as e:
        # We can return a JSONResponse with error, but frontend might expect 200 with error info?
        # Flask code returned error_response(..., 500).
        # We can raise HTTPException or return error_response.
        # Let's return error_response but signature says Dict.
        # If we return JSONResponse, it overrides the response_model/signature.
        return error_response(f"Yorum hatası: {str(e)}", 500)
