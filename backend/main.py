import os
import json
from fastapi import FastAPI
from pydantic import BaseModel
from groq import Groq
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# Frontend (Expo) bağlantısı için kritik ayar
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq API Kurulumu
client = Groq(
    api_key="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"
)

class UserInput(BaseModel):
    goal: str
    hours: int

@app.post("/generate-program")
async def generate_program(user_data: UserInput):
    print(f"Bağlantı Başarılı: {user_data.goal} hedefi için {user_data.hours} saatlik program isteniyor.")
    
    prompt = f"""
    Hedef: {user_data.goal} öğrencisiyim (YKS hazırlığı). 
    Günlük Çalışma Süresi: {user_data.hours} saat. 
    Görev: Haftalık, her günü ayrı ayrı planlayan bir ders programı hazırla.
    Format Kuralları: SADECE bir JSON listesi döndür. 
    Örnek Yapı: [
      {{"gun": "Pazartesi", "ders": "Matematik", "konu": "Fonksiyonlar", "sure": "2 Saat"}},
      {{"gun": "Pazartesi", "ders": "Türkçe", "konu": "Paragraf", "sure": "1 Saat"}}
    ]
    """
    
    try:
        # Groq ile AI isteği
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "Sen sadece saf JSON döndüren profesyonel bir eğitim koçusun."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"} # JSON modunu aktif ediyoruz
        )
        
        # AI'dan gelen veriyi al
        raw_content = completion.choices[0].message.content
        
        # Groq bazen {"program": [...]} şeklinde döndürebilir, içindeki listeyi çekelim
        parsed_data = json.loads(raw_content)
        
        # Eğer liste değilse ve bir anahtarın içindeyse (örn: 'program' veya 'plan') onu al
        if isinstance(parsed_data, dict):
            # Sözlük içindeki ilk listeyi bulmaya çalış
            for value in parsed_data.values():
                if isinstance(value, list):
                    return {"status": "success", "program": value}
            return {"status": "success", "program": parsed_data}
            
        return {"status": "success", "program": parsed_data}

    except Exception as e:
        print(f"Hata Oluştu: {str(e)}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)