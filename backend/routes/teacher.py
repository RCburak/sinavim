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
