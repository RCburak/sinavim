"""Yönetici (Admin / Kurum Sahibi) paneli rotaları."""
from flask import Blueprint, request, render_template
from utils.responses import success_response, error_response
from utils.validators import require_keys
from errors import ValidationError
from services.admin_service import admin_service

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/panel", methods=["GET"])
def admin_panel():
    """Admin web panelini sunar."""
    return render_template("admin_panel.html")


@admin_bp.route("/login", methods=["POST"])
def admin_login():
    """Kurum sahibi girişi (institutions koleksiyonundan)."""
    data = request.get_json(silent=True) or {}
    try:
        require_keys(data, ["email", "password"])
    except ValidationError as e:
        return error_response(e.message, 400)

    admin, err = admin_service.login(data["email"], data["password"])
    if err:
        return error_response(err, 401)
    return success_response({"admin": admin})


@admin_bp.route("/teachers", methods=["GET"])
def list_teachers():
    """Kurum sahibine ait öğretmen listesi."""
    admin_id = request.args.get("admin_id")
    if not admin_id:
        return error_response("admin_id gerekli.", 400)
    teachers = admin_service.list_teachers(admin_id)
    return success_response({"teachers": teachers})


@admin_bp.route("/create-teacher", methods=["POST"])
def create_teacher():
    """Yeni öğretmen oluşturma (admin_id ile bağlı)."""
    data = request.get_json(silent=True) or {}
    try:
        require_keys(data, ["admin_id", "name"])
    except ValidationError as e:
        return error_response(e.message, 400)

    teacher, err = admin_service.create_teacher(
        data["admin_id"], data["name"]
    )
    if err:
        return error_response(err, 400)
    return success_response({"teacher": teacher}, status_code=201)


@admin_bp.route("/delete-teacher", methods=["POST"])
def delete_teacher():
    """Öğretmen silme (sadece kendi kurumundakileri)."""
    data = request.get_json(silent=True) or {}
    teacher_id = data.get("teacher_id")
    admin_id = data.get("admin_id")
    if not teacher_id or not admin_id:
        return error_response("teacher_id ve admin_id gerekli.", 400)

    ok, err = admin_service.delete_teacher(teacher_id, admin_id)
    if not ok:
        return error_response(err, 400)
    return success_response(message="Öğretmen silindi.")


@admin_bp.route("/register/<token>", methods=["GET"])
def teacher_register_page(token):
    """Öğretmen kayıt sayfasını gösterir."""
    teacher, err = admin_service.get_teacher_by_token(token)
    if err:
        return render_template("teacher_register.html", error=err, teacher=None, token=token)
    return render_template("teacher_register.html", error=None, teacher=teacher, token=token)


@admin_bp.route("/complete-registration", methods=["POST"])
def complete_registration():
    """Öğretmen kaydını tamamlar."""
    data = request.get_json(silent=True) or {}
    try:
        require_keys(data, ["token", "email", "password"])
    except ValidationError as e:
        return error_response(e.message, 400)

    if len(data["password"]) < 6:
        return error_response("Şifre en az 6 karakter olmalı.", 400)

    ok, err = admin_service.register_teacher(
        data["token"], data["email"], data["password"]
    )
    if not ok:
        return error_response(err, 400)
    return success_response(message="Kayıt başarıyla tamamlandı! Artık giriş yapabilirsiniz.")
