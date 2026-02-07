import os
import json
import logging
from groq import Groq
from dotenv import load_dotenv

# Loglama ayarları
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

def generate_ai_schedule(goal, hours):
    """
    Öğrencinin YKS hedefine göre branş bazlı, haftalık ve detaylı bir program üretir.
    Kullanıcının belirlediği günlük çalışma süresini tam kapasite doldurmaya odaklanır.
    """
    
    # Branş kontrolü
    branch_note = ""
    if "Sayısal" in goal:
        branch_note = "Sayısal öğrencisi olduğu için Matematik, Fizik, Kimya ve Biyoloji ağırlıklı, spesifik YKS konuları seç."
    elif "Sözel" in goal:
        branch_note = "Sözel öğrencisi olduğu için Edebiyat, Tarih ve Coğrafya ağırlıklı, spesifik YKS konuları seç."
    elif "TYT" in goal:
        branch_note = "TYT odaklı bir program yap; Problem, Paragraf ve temel bilimleri her güne yay."

    # Prompt üzerinde süre doldurma baskısını artırıyoruz
    system_prompt = f"""
    Sen kıdemli ve disiplinli bir YKS Eğitim Koçusun. 
    Öğrencinin Hedefi: {goal}. 
    Günlük Hedef Çalışma Süresi: {hours} SAAT.
    Uzmanlık Notu: {branch_note}

    GÖREVİN:
    1. 7 günlük (Pazartesi'den Pazar'a) tam bir haftalık program oluştur.
    2. ÖNEMLİ: Her bir günün toplam ders süresi TAM OLARAK {hours} saat olmalıdır. Süreyi eksik bırakma.
    3. Süreyi doldurmak için günleri 'Konu Anlatımı', 'Soru Çözümü' ve 'Branş Denemesi' gibi farklı bloklara böl.
    4. 'task' kısmında spesifik YKS konusu yaz (Örn: 'Matematik - Türev Karma Soru Çözümü').
    5. 'duration' alanını '1.5 Saat', '2 Saat' veya '45 Dakika' gibi net ifadelerle yaz.
    6. 'questions' miktarını çalışma süresiyle orantılı ve yüksek tut (Örn: 2 saatlik blok için en az 50-60 soru).
    7. Yanıtı SADECE aşağıdaki JSON yapısında döndür:
    {{
        "program": [
            {{"gun": "Pazartesi", "task": "...", "duration": "2 Saat", "questions": 60}},
            {{"gun": "Pazartesi", "task": "...", "duration": "2 Saat", "questions": 45}},
            {{"gun": "Salı", "task": "...", "duration": "...", "questions": 30}}
        ]
    }}
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": system_prompt}],
            # Detaylı ve zengin içerik üretmesi için temperature'ı artırdık
            temperature=0.6, 
            response_format={"type": "json_object"}
        )
        
        content = completion.choices[0].message.content
        response_data = json.loads(content)
        
        raw_list = response_data.get("program", [])
        final_list = []
        for item in raw_list:
            # Veritabanı (SQLite) INTEGER tipini garantiye alıyoruz
            try:
                q_count = int(item.get("questions", 0))
            except:
                q_count = 0

            final_list.append({
                "gun": item.get("gun", item.get("day", "Pazartesi")),
                "task": item.get("task", "Ders Çalışma"),
                "duration": item.get("duration", "1 Saat"),
                "questions": q_count,
                "completed": False
            })
            
        logger.info(f"✅ AI Programı üretildi: {len(final_list)} görev eklendi.")
        return final_list

    except Exception as e:
        logger.error(f"❌ AI Servis Hatası: {e}")
        return None

def get_performance_insight(analizler):
    """
    Deneme netlerini analiz ederek öğrenciye gelişim stratejisi sunar.
    """
    if not analizler:
        return "Henüz yeterli deneme verisi yok. İlk denemeni ekle, gelişimi beraber izleyelim!"

    ozet = "\n".join([f"{a['ad']}: {a['net']} Net" for a in analizler[:5]])
    
    prompt = f"""
    Bir YKS Eğitim Koçusun. Öğrencinin son deneme netleri:
    {ozet}
    
    Bu sonuçları analiz et. Gelişimi yorumla ve öğrenciyi motive edecek profesyonel bir koç tavsiyesi ver (Maks 120 karakter).
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return completion.choices[0].message.content
    except Exception as e:
        logger.error(f"❌ Analiz Hatası: {e}")
        return "Gelişimin istikrarlı, TYT eksiklerini kapatmaya odaklan!"