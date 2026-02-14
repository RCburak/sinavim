"""Soru havuzu rotaları."""
from flask import Blueprint, request, jsonify
from utils.responses import success_response, error_response
from utils.validators import require_keys
from errors import ValidationError
from services.question_service import question_service

print("Loading questions_bp...")
questions_bp = Blueprint("questions", __name__)

@questions_bp.route("/questions/add", methods=["POST"])
def add_question():
    """Yeni soru ekler (Multipart form: image, user_id, lesson...)."""
    # Multipart form data
    if 'image' not in request.files:
        return error_response("Resim dosyası gerekli (key: image)", 400)
    
    file = request.files['image']
    user_id = request.form.get('user_id')
    lesson = request.form.get('lesson')
    topic = request.form.get('topic', '')
    notes = request.form.get('notes', '')

    if not user_id or not lesson:
        return error_response("user_id ve lesson gerekli", 400)

    result, err = question_service.add(user_id, file, lesson, topic, notes)
    if err:
        return error_response(err, 500)
    
    return success_response(result, message="Soru havuza eklendi!", status_code=201)

@questions_bp.route("/questions/<user_id>", methods=["GET"])
def get_questions(user_id):
    """Soru listesini getirir."""
    lesson = request.args.get("lesson")
    status = request.args.get("status") # solved, unsolved
    
    questions = question_service.get_all(user_id, lesson, status)
    return jsonify(questions)

@questions_bp.route("/questions/<question_id>/status", methods=["PUT"])
def update_status(question_id):
    """Soru durumunu günceller (Solved/Unsolved)."""
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    solved = data.get("solved")

    if not user_id or solved is None:
        return error_response("user_id ve solved parametresi gerekli", 400)

    ok, err = question_service.update_status(user_id, question_id, solved)
    if not ok:
        return error_response(err, 500)
    
    return success_response(message="Soru durumu güncellendi.")

@questions_bp.route("/questions/<question_id>", methods=["DELETE"])
def delete_question(question_id):
    """Soruyu siler."""
    user_id = request.args.get("user_id")
    if not user_id:
        return error_response("user_id gerekli", 400)
        
    ok, err = question_service.delete(user_id, question_id)
    if not ok:
        return error_response(err, 500)
    
    return success_response(message="Soru silindi.")
