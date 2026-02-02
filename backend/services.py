import os
import json
import logging
from groq import Groq
from dotenv import load_dotenv

# Loglama ayarları: Hataları ve süreçleri takip etmek için
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

def generate_ai_schedule(goal, hours):
    """
    Öğrencinin hedefine göre pedagojik ve sürdürülebilir bir program üretir.
    """
    # Prompt Mühendisliği: AI'ya daha spesifik talimatlar veriyoruz.
    system_prompt = f"""
    Sen kıdemli bir akademik danışmansın. Kullanıcının hedefi: {goal}. 
    Günlük çalışma kapasitesi: {hours} saat.
    
    GÖREVİN:
    1. Haftalık dengeli bir program oluştur.
    2. Konu anlatımı, soru çözümü ve tekrar günlerini mantıklı bir sıraya koy.
    3. Yanıtı SADECE aşağıdaki JSON yapısında döndür:
    {{
        "program": [
            {{"day": "Pazartesi", "task": "...", "duration": "..."}}
        ]
    }}
    """

    try:
        # llama-3.1-8b-instant modeli güncel ve hızlıdır.
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": system_prompt}],
            temperature=0.6, # Tutarlılığı artırmak için biraz düşürdük.
            response_format={"type": "json_object"}
        )
        
        response_data = json.loads(completion.choices[0].message.content)
        # Frontend'in beklediği 'program' listesini güvenle döndürür.
        return response_data.get("program", [])

    except json.JSONDecodeError as e:
        logger.error(f"❌ JSON Parse Hatası: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ AI Servis Hatası: {e}")
        return None

def get_performance_insight(analizler):
    """
    Deneme netlerini analiz ederek öğrenciye gelişim stratejisi sunar.
    """
    if not analizler:
        return "Henüz veri girişi yapılmamış."

    # Son 5 denemeyi özetle
    ozet = "\n".join([f"{a['ad']}: {a['net']} Net" for a in analizler[:5]])
    
    prompt = f"""
    Öğrencinin son deneme sonuçları:
    {ozet}
    
    Bu verileri analiz et. Netlerde düşüş mü var, artış mı? 
    Bir eğitim koçu olarak öğrenciye 'akademik' ve 'somut' bir tavsiye ver (Maks 100 karakter).
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )
        return completion.choices[0].message.content
    except Exception as e:
        logger.error(f"❌ Analiz Hatası: {e}")
        return "Gelişimin istikrarlı, eksik konularına odaklanmaya devam et!"