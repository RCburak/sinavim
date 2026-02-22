"""Öğretmen paneli rotaları (FastAPI)."""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from utils.responses import success_response, error_response
from services.teacher_service import teacher_service
from middleware.auth import create_token, require_teacher
from schemas import (
    TeacherLoginRequest,
    AssignProgramRequest,
    ApproveStudentRequest,
    CreateClassRequest,
    AssignClassRequest,
    DeleteClassRequest,
    CreateAssignmentTemplateRequest,
    DeleteAssignmentTemplateRequest,
    CreateAnnouncementRequest,
    CreateMessageRequest,
    CreateMaterialRequest,
    CreateCalendarEventRequest,
)

teacher_router = APIRouter()


@teacher_router.post("/login")
def teacher_login(req: TeacherLoginRequest):
    """Öğretmen girişi."""
    teacher, err = teacher_service.login(req.email, req.password)
    if err:
        return error_response(err, 401)
    token = create_token(teacher["id"], "teacher")
    return success_response({"teacher": teacher, "token": token})


@teacher_router.get("/students/{institution_id}")
def get_students(
    institution_id: str,
    teacher_type: str = "teacher",
    admin_id: str = None,
    auth: dict = Depends(require_teacher)
) -> List[Dict[str, Any]]:
    """Kurumun öğrenci listesi. Rehber öğretmen tüm öğrencileri görür."""
    students = teacher_service.get_students(institution_id, teacher_type=teacher_type, admin_id=admin_id)
    return students


@teacher_router.post("/assign-program")
def assign_program(req: AssignProgramRequest, auth: dict = Depends(require_teacher)):
    """Öğrenciye haftalık program atama."""
    ok, err = teacher_service.assign_program(req.student_id, req.program)
    if err:
        return error_response(err, 500)
    return success_response(message="Haftalık program başarıyla atandı!", status_code=201)


@teacher_router.post("/approve-student")
def approve_student(req: ApproveStudentRequest, auth: dict = Depends(require_teacher)):
    """Öğrenci onaylama."""
    ok, err = teacher_service.approve_student(req.student_id)
    if not ok:
        return error_response(err, 500)
    return success_response(message="Öğrenci onaylandı.")


@teacher_router.post("/create-class")
def create_class(req: CreateClassRequest, auth: dict = Depends(require_teacher)):
    """Yeni sınıf oluşturma (sadece rehber öğretmen)."""
    if req.teacher_type != "rehber":
        return error_response("Sadece rehber öğretmenler sınıf oluşturabilir.", 403)
    res, err = teacher_service.create_class(req.institution_id, req.name)
    if err:
        return error_response(err, 500)
    return success_response(res)


@teacher_router.get("/classes/{institution_id}")
def get_classes_route(
    institution_id: str, auth: dict = Depends(require_teacher)
) -> List[Dict[str, Any]]:
    """Sınıfları listeleme."""
    classes = teacher_service.get_classes(institution_id)
    return classes


@teacher_router.post("/assign-class")
def assign_class(req: AssignClassRequest, auth: dict = Depends(require_teacher)):
    """Öğrenciyi sınıfa atama (sadece rehber öğretmen)."""
    if req.teacher_type != "rehber":
        return error_response("Sadece rehber öğretmenler öğrenciyi sınıfa atayabilir.", 403)
    ok, err = teacher_service.update_student_class(req.student_id, req.class_id)
    if not ok:
        return error_response(err, 500)
    return success_response(message="Öğrenci sınıfı güncellendi.")


@teacher_router.post("/delete-class")
def delete_class(req: DeleteClassRequest, auth: dict = Depends(require_teacher)):
    """Sınıf silme (sadece rehber öğretmen)."""
    if req.teacher_type != "rehber":
        return error_response("Sadece rehber öğretmenler sınıf silebilir.", 403)
    ok, err = teacher_service.delete_class(req.institution_id, req.class_id)
    if not ok:
        return error_response(err, 500)
    return success_response(message="Sınıf silindi.")
@teacher_router.get("/institution/{institution_id}")
def get_institution_route(institution_id: str, auth: dict = Depends(require_teacher)):
    """Kurum bilgilerini döner."""
    inst = teacher_service.get_institution(institution_id)
    if not inst:
        return error_response("Kurum bulunamadı.", 404)
    return success_response(inst)


@teacher_router.post("/create-template")
def create_template_route(req: CreateAssignmentTemplateRequest, auth: dict = Depends(require_teacher)):
    """Ödev şablonu oluşturur."""
    res, err = teacher_service.create_template(req.teacher_id, req.name, req.items)
    if err:
        return error_response(err, 500)
    return success_response(res)


@teacher_router.get("/templates/{teacher_id}")
def get_templates_route(teacher_id: str, auth: dict = Depends(require_teacher)):
    """Şablonları listeler."""
    templates = teacher_service.get_templates(teacher_id)
    return templates


@teacher_router.post("/delete-template")
def delete_template_route(req: DeleteAssignmentTemplateRequest, auth: dict = Depends(require_teacher)):
    """Şablonu siler."""
    ok, err = teacher_service.delete_template(req.teacher_id, req.template_id)
    if not ok:
        return error_response(err, 500)
    return success_response(message="Şablon silindi.")


@teacher_router.post("/create-announcement")
def create_announcement_route(req: CreateAnnouncementRequest, auth: dict = Depends(require_teacher)):
    """Duyuru oluşturur."""
    res, err = teacher_service.create_announcement(
        req.institution_id, req.author_id, req.title, req.content, req.class_id, req.image_url
    )
    if err:
        return error_response(err, 500)
    return success_response(res)


@teacher_router.get("/announcements/{institution_id}")
def get_announcements_route(institution_id: str, class_id: str | None = None, auth: dict = Depends(require_teacher)):
    """Duyuruları listeler."""
    announcements = teacher_service.get_announcements(institution_id, class_id)
    return announcements


@teacher_router.post("/send-message")
def send_message_route(req: CreateMessageRequest, auth: dict = Depends(require_teacher)):
    """Mesaj gönderir."""
    ok, err = teacher_service.send_message(req.sender_id, req.receiver_id, req.content)
    if not ok:
        return error_response(err, 500)
    return success_response(message="Mesaj gönderildi.")


@teacher_router.post("/create-material")
def create_material_route(req: CreateMaterialRequest, auth: dict = Depends(require_teacher)):
    """Materyal ekler."""
    res, err = teacher_service.create_material(
        req.institution_id, req.teacher_id, req.title, req.file_url, req.type, req.class_id
    )
    if err:
        return error_response(err, 500)
    return success_response(res)


@teacher_router.get("/materials/{institution_id}")
def get_materials_route(institution_id: str, class_id: str | None = None, auth: dict = Depends(require_teacher)):
    """Materyalleri listeler."""
    materials = teacher_service.get_materials(institution_id, class_id)
    return materials


@teacher_router.post("/create-event")
def create_event_route(req: CreateCalendarEventRequest, auth: dict = Depends(require_teacher)):
    """Etkinlik ekler."""
    res, err = teacher_service.create_event(
        req.institution_id, req.title, req.date, req.type, req.description, req.class_id
    )
    if err:
        return error_response(err, 500)
    return success_response(res)


@teacher_router.get("/events/{institution_id}")
def get_events_route(institution_id: str, class_id: str | None = None, auth: dict = Depends(require_teacher)):
    """Etkinlikleri listeler."""
    events = teacher_service.get_events(institution_id, class_id)
    return events


@teacher_router.get("/leaderboard/{institution_id}")
def get_leaderboard_route(institution_id: str, class_id: str | None = None, auth: dict = Depends(require_teacher)):
    """Başarı sıralamasını getirir."""
    leaderboard = teacher_service.get_leaderboard(institution_id, class_id)
    return leaderboard
