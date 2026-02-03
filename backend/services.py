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
    """
    
    # Branş kontrolü yaparak AI'ya ekstra uzmanlık bilgisi ekliyoruz
    branch_note = ""
    if "Sayısal" in goal:
        branch_note = "Sayısal öğrencisi olduğu için Matematik, Fizik, Kimya ve Biyoloji ağırlıklı, spesifik YKS konuları seç."
    elif "Sözel" in goal:
        branch_note = "Sözel öğrencisi olduğu için Edebiyat, Tarih ve Coğrafya ağırlıklı, spesifik YKS konuları seç."
    elif "TYT" in goal:
        branch_note = "TYT odaklı bir program yap; Problem, Paragraf ve temel bilimleri her güne yay."

    system_prompt = f"""
    Sen kıdemli bir YKS Eğitim Koçusun. 
    Öğrencinin Hedefi: {goal}. 
    Günlük Çalışma Süresi: {hours} saat.
    Uzmanlık Notu: {branch_note}

    GÖREVİN:
    1. 7 günlük (Pazartesi'den Pazar'a) tam bir haftalık program oluştur.
    2. Dersleri günlere dengeli dağıt. Tüm dersleri aynı güne yığma.
    3. 'task' kısmında sadece ders adı değil, spesifik YKS konusu yaz (Örn: 'Matematik - Logaritma Soru Çözümü').
    4. Her günün toplam süresi {hours} saati geçmesin.
    5. Yanıtı SADECE aşağıdaki JSON yapısında döndür, metin ekleme:
    {{
        "program": [
            {{"gun": "Pazartesi", "task": "...", "duration": "1 Saat"}},
            {{"gun": "Pazartesi", "task": "...", "duration": "2 Saat"}},
            {{"gun": "Salı", "task": "...", "duration": "..."}}
        ]
    }}
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": system_prompt}],
            temperature=0.5, # YKS konularında daha tutarlı olması için düşürdük
            response_format={"type": "json_object"}
        )
        
        content = completion.choices[0].message.content
        response_data = json.loads(content)
        
        # Frontend 'gun' anahtarını beklediği için AI'nın 'day' demesine karşı önlem alıyoruz
        raw_list = response_data.get("program", [])
        final_list = []
        for item in raw_list:
            final_list.append({
                "gun": item.get("gun", item.get("day", "Pazartesi")),
                "task": item.get("task", "Ders Çalışma"),
                "duration": item.get("duration", "1 Saat"),
                "completed": False
            })
            
        logger.info(f"✅ AI Programı başarıyla üretildi: {len(final_list)} görev.")
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
    
    Bu sonuçları analiz et. Gelişimi yorumla ve öğrenciyi motive edecek, 
    aynı zamanda eksik kapatmaya yönelik profesyonel bir koç tavsiyesi ver (Maks 120 karakter).
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
        return "Gelişimin istikrarlı, TYT eksiklerini kapatmaya ve deneme analizlerine odaklan!"