"""Öğretmen paneli rotaları."""
from flask import Blueprint, request, jsonify
from utils.responses import success_response, error_response
from utils.validators import require_keys
from errors import ValidationError
from services.teacher_service import teacher_service

teacher_bp = Blueprint("teacher", __name__)


@teacher_bp.route("/login", methods=["POST"])
def teacher_login():
    """Öğretmen girişi."""
    data = request.get_json(silent=True) or {}
    try:
        require_keys(data, ["email", "password"])
    except ValidationError as e:
        return error_response(e.message, 400)

    teacher, err = teacher_service.login(data["email"], data["password"])
    if err:
        return error_response(err, 401)
    return success_response({"teacher": teacher})


@teacher_bp.route("/students/<institution_id>", methods=["GET"])
def get_students(institution_id):
    """Kurumun öğrenci listesi (frontend uyumluluk için ham array)."""
    students = teacher_service.get_students(institution_id)
    return jsonify(students)


@teacher_bp.route("/assign-program", methods=["POST"])
def assign_program():
    """Öğrenciye haftalık program atama."""
    data = request.get_json(silent=True) or {}
    try:
        require_keys(data, ["student_id", "program"])
    except ValidationError as e:
        return error_response(e.message, 400)

    program_list = data.get("program", [])
    ok, err = teacher_service.assign_program(data["student_id"], program_list)
    if err:
        return error_response(err, 500)
    return success_response(message="Haftalık program başarıyla atandı!", status_code=201)


@teacher_bp.route("/approve-student", methods=["POST"])
def approve_student():
    """Öğrenci onaylama."""
    data = request.get_json(silent=True) or {}
    student_id = data.get("student_id")
    if not student_id:
        return error_response("student_id gerekli", 400)
    
    ok, err = teacher_service.approve_student(student_id)
    if not ok:
        return error_response(err, 500)
    return success_response(message="Öğrenci onaylandı.")


@teacher_bp.route("/create-class", methods=["POST"])
def create_class():
    """Yeni sınıf oluşturma."""
    data = request.get_json(silent=True) or {}
    inst_id = data.get("institution_id")
    name = data.get("name")
    if not inst_id or not name:
        return error_response("institution_id ve name gerekli", 400)
    
    res, err = teacher_service.create_class(inst_id, name)
    if err:
        return error_response(err, 500)
    return success_response(res)


@teacher_bp.route("/classes/<institution_id>", methods=["GET"])
def get_classes_route(institution_id):
    """Sınıfları listeleme."""
    classes = teacher_service.get_classes(institution_id)
    return jsonify(classes)


@teacher_bp.route("/assign-class", methods=["POST"])
def assign_class():
    """Öğrenciyi sınıfa atama."""
    data = request.get_json(silent=True) or {}
    student_id = data.get("student_id")
    class_id = data.get("class_id") # None olabilir (sınıfsız)
    
    if not student_id:
        return error_response("student_id gerekli", 400)
        
    ok, err = teacher_service.update_student_class(student_id, class_id)
    if not ok:
        return error_response(err, 500)
    return success_response(message="Öğrenci sınıfı güncellendi.")
