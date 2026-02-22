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
