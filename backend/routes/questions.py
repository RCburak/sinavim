"""Soru havuzu rotaları (FastAPI)."""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form
from utils.responses import success_response, error_response
from services.question_service import question_service
from schemas import UpdateQuestionStatusRequest

print("Loading questions_router...")
questions_router = APIRouter()

@questions_router.post("/add")
def add_question(
    image: UploadFile = File(...),
    user_id: str = Form(...),
    lesson: str = Form(...),
    topic: str = Form(""),
    notes: str = Form("")
):
    """Yeni soru ekler (Multipart form: image, user_id, lesson...)."""
    # Service expects 'file' object with .read(), .filename etc.
    # FastAPI UploadFile provides .file (SpooledTemporaryFile) which works similar to Flask's file
    # However, we might need to pass `image.file` or just `image`.
    # Let's check question_service.add. It likely passes it to Firebase Storage.
    # If the service expects a file-like object with .read() and .content_type, UploadFile has .file and .content_type
    
    # We might need to ensure the service handles FastAPI's UploadFile correctly.
    # Ideally, we should update the service or pass a compatible object.
    # For now, let's pass `image` and assume we might need to tweak service if it uses specific Flask-File attributes.
    # UploadFile has .filename, .content_type, .file
    
    # We pass the file-like object (SpoolTemporaryFile) and content_type explicitly
    result, err = question_service.add(user_id, image.file, lesson, topic, notes, content_type=image.content_type)
    if err:
        return error_response(err, 500)
    
    return success_response(result, message="Soru havuza eklendi!", status_code=201)

@questions_router.get("/{user_id}")
def get_questions(
    user_id: str,
    lesson: Optional[str] = None,
    status: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Soru listesini getirir."""
    questions = question_service.get_all(user_id, lesson, status)
    return questions

@questions_router.put("/{question_id}/status")
def update_status(question_id: str, req: UpdateQuestionStatusRequest):
    """Soru durumunu günceller (Solved/Unsolved)."""
    ok, err = question_service.update_status(req.user_id, question_id, req.solved)
    if not ok:
        return error_response(err, 500)
    
    return success_response(message="Soru durumu güncellendi.")

@questions_router.delete("/{question_id}")
def delete_question(question_id: str, user_id: str):
    """Soruyu siler."""
    ok, err = question_service.delete(user_id, question_id)
    if not ok:
        return error_response(err, 500)
    
    return success_response(message="Soru silindi.")
