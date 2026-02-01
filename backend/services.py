import os
from groq import Groq
from dotenv import load_dotenv
import json

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_ai_schedule(goal, hours):
    """
    Kullanıcının hedefine göre haftalık program üretir.
    """
    system_prompt = f"""
    Sen Burak'ın profesyonel eğitim koçusun. Burak yazılım (Python, Unity) ve oyunlarla ilgileniyor.
    Onun için haftalık bir ders programı hazırla.
    
    KURALLAR:
    1. Yanıt sadece geçerli bir JSON listesi olmalıdır.
    2. Format: [{{"gun": "Pazartesi", "ders": "Matematik", "konu": "Fonksiyonlar", "sure": "2 Saat"}}]
    3. Günlük toplam süre {hours} saati aşmasın.
    4. Hedefi: {goal}
    5. Hafta sonuna mutlaka 'Yazılım Projesi' veya 'Oyun Vakti' gibi Burak'ın hobilerini de ekle.
    """

    try:
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "system", "content": system_prompt}],
            response_format={"type": "json_object"}
        )
        # JSON string'i Python listesine çevirip döndürüyoruz
        result = json.loads(completion.choices[0].message.content)
        return result.get("program", result) # Bazı modeller 'program' anahtarı altına koyabiliyor
    except Exception as e:
        print(f"AI Servis Hatası: {e}")
        return None