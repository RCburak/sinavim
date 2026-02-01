from flask import request, jsonify
from services import generate_ai_schedule

def setup_routes(app):
    @app.route('/generate-program', methods=['POST'])
    def handle_generate():
        data = request.json
        goal = data.get('goal')
        hours = data.get('hours')

        if not goal or not hours:
            return jsonify({"status": "error", "message": "Eksik bilgi"}), 400

        program = generate_ai_schedule(goal, hours)
        
        if program:
            return jsonify({"status": "success", "program": program})
        else:
            return jsonify({"status": "error", "message": "Program oluşturulamadı"}), 500