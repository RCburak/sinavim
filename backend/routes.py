from flask import request, jsonify
from database import get_db_connection
from services import client 
import json

def setup_routes(app):
    # --- ANALİZ SİLME ---
    @app.route('/analiz-sil/<int:id>', methods=['DELETE'])
    def analiz_sil(id):
        conn = get_db_connection()
        conn.execute('DELETE FROM analizler WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({"mesaj": "Veri başarıyla silindi!"}), 200

    # --- ANALİZLERİ LİSTELEME ---
    @app.route('/analizler', methods=['GET'])
    def get_analizler():
        conn = get_db_connection()
        # 'deneme_ad' sütununu frontend ile uyumlu olması için 'ad' olarak çekiyoruz
        veriler = conn.execute('SELECT id, deneme_ad as ad, net, tarih FROM analizler ORDER BY id DESC').fetchall()
        conn.close()
        return jsonify([dict(row) for row in veriler])

    # --- ANALİZ EKLEME ---
    @app.route('/analiz-ekle', methods=['POST'])
    def analiz_ekle():
        yeni_veri = request.get_json()
        ad = yeni_veri.get('ad')
        net = yeni_veri.get('net')
        tarih = yeni_veri.get('tarih')

        conn = get_db_connection()
        conn.execute('INSERT INTO analizler (deneme_ad, net, tarih) VALUES (?, ?, ?)',
                     (ad, net, tarih))
        conn.commit()
        conn.close()
        return jsonify({"mesaj": "Veri kaydedildi!"}), 201

    # --- AI PROGRAM HAZIRLAMA ---
    @app.route('/generate-program', methods=['POST'])
    def generate_program():
        try:
            data = request.get_json()
            goal = data.get('goal', 'Genel Hedef')
            hours = data.get('hours', 4)

            system_prompt = f"""
            Sen Burak'ın eğitim koçusun. Burak yazılım (Python, React Native) ve oyunlarla ilgileniyor.
            Onun için {goal} hedefinde, günlük {hours} saatlik bir haftalık çalışma programı hazırla.
            KESİNLİKLE sadece şu JSON formatında cevap ver, başka metin ekleme: 
            {{
              "status": "success", 
              "program": [
                {{"day": "Pazartesi", "task": "Konu Çalışması", "duration": "2 Saat"}},
                {{"day": "Salı", "task": "Soru Çözümü", "duration": "2 Saat"}},
                {{"day": "Çarşamba", "task": "Deneme", "duration": "3 Saat"}},
                {{"day": "Perşembe", "task": "Tekrar", "duration": "2 Saat"}},
                {{"day": "Cuma", "task": "Pratik", "duration": "2 Saat"}},
                {{"day": "Cumartesi", "task": "Genel Tekrar", "duration": "3 Saat"}},
                {{"day": "Pazar", "task": "Dinlenme", "duration": "1 Saat"}}
              ]
            }}
            """

            # Model ismini güncelledik: llama-3.1-8b-instant
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "system", "content": system_prompt}],
                response_format={ "type": "json_object" } 
            )
            
            ai_raw = completion.choices[0].message.content
            ai_json = json.loads(ai_raw)
            
            if "status" not in ai_json:
                ai_json["status"] = "success"
                
            return jsonify(ai_json)

        except Exception as e:
            print(f"!!! PROGRAM HATASI: {str(e)}")
            return jsonify({"status": "error", "message": "Program oluşturulamadı"}), 500

    # --- AI ANALİZ YORUMU ---
    @app.route('/ai-yorumla', methods=['GET'])
    def ai_yorumla():
        conn = get_db_connection()
        veriler = conn.execute('SELECT deneme_ad, net FROM analizler ORDER BY id DESC LIMIT 5').fetchall()
        conn.close()

        if not veriler:
            return jsonify({"yorum": "Henüz veri yok Burak. Birkaç deneme ekle, hemen yorumlayayım! 🚀"})

        deneme_ozeti = ", ".join([f"{row['deneme_ad']}: {row['net']} net" for row in veriler])
        
        # Senin yazılım ve oyun tutkunu buraya ekledim
        system_prompt = f"""
        Sen Burak'ın eğitim koçusun. Burak yazılım geliştirme (Python, React Native) ve oyunlarla ilgileniyor.
        Onun son deneme netleri: {deneme_ozeti}. 
        Ona yazılım dünyasından benzetmeler içeren (debug etmek, deploy etmek gibi), 
        samimi ve motive edici kısa bir yorum yap.
        """

        try:
            # Model ismini burada da güncelledik
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "system", "content": system_prompt}]
            )
            return jsonify({"yorum": completion.choices[0].message.content})
        except Exception as e:
            print(f"!!! ANALİZ HATASI: {str(e)}")
            return jsonify({"yorum": "AI şu an meşgul, ama netlerin harika görünüyor! 👍"}), 500