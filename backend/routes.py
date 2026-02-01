from flask import request, jsonify
from database import get_db_connection
from services import client # Groq istemcisini services'dan çekiyoruz
import json

def setup_routes(app):
    # ... mevcut /analizler ve /analiz-ekle rotaların burada kalıyor ...

    @app.route('/ai-yorumla', methods=['GET'])
    def ai_yorumla():
        conn = get_db_connection()
        # Son 5 denemeyi çekelim
        veriler = conn.execute('SELECT deneme_ad, net FROM analizler ORDER BY id DESC LIMIT 5').fetchall()
        conn.close()

        if not veriler:
            return jsonify({"yorum": "Henüz analiz edilecek kadar verimiz yok Burak. Birkaç deneme ekle, hemen yorumlayayım! 🚀"})

        # Verileri AI'nın anlayacağı metne çeviriyoruz
        deneme_ozeti = ", ".join([f"{row['deneme_ad']}: {row['net']} net" for row in veriler])

        system_prompt = f"""
        Sen Burak'ın eğitim koçusun. Burak yazılım geliştirme (Python, React Native) ve oyunlarla ilgileniyor.
        Onun son deneme netleri şunlar: {deneme_ozeti}
        
        Bu verileri analiz et ve Burak'a kısa (maks 3 cümle), samimi, motive edici ve yazılım dünyasından 
        benzetmeler içeren bir geri bildirim ver.
        """

        try:
            completion = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "system", "content": system_prompt}]
            )
            yorum = completion.choices[0].message.content
            return jsonify({"yorum": yorum})
        except Exception as e:
            return jsonify({"yorum": "AI şu an biraz meşgul, ama netlerin bende güvende! 👍"}), 500