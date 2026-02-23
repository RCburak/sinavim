"""Flashcard sistemi servisi (Firestore)."""
import logging
from datetime import datetime
from firebase_admin import firestore
from firebase_db import get_firestore

logger = logging.getLogger(__name__)

COLLECTION_DECKS = "flashcard_decks"
COLLECTION_DUELS = "flashcard_duels"
COLLECTION_USERS = "users"

def _doc_to_dict(doc) -> dict:
    data = doc.to_dict()
    data["id"] = doc.id
    for key, val in data.items():
        if hasattr(val, "isoformat"):
            data[key] = val.isoformat()
    return data

class FlashcardService:
    @staticmethod
    def create_shared_deck(creator_id: str, title: str, subject: str, cards: list):
        """Yeni bir paylaşımlı deste oluşturur."""
        try:
            db = get_firestore()
            deck_ref = db.collection(COLLECTION_DECKS).add({
                "creator_id": creator_id,
                "title": title,
                "subject": subject,
                "cards": cards,
                "created_at": firestore.SERVER_TIMESTAMP,
                "is_public": True
            })
            return deck_ref[1].id, None
        except Exception as e:
            logger.exception("Create shared deck error")
            return None, str(e)

    @staticmethod
    def get_deck(deck_id: str):
        """Deste içeriğini getirir."""
        try:
            db = get_firestore()
            doc = db.collection(COLLECTION_DECKS).document(deck_id).get()
            if not doc.exists:
                return None, "Deste bulunamadı."
            return _doc_to_dict(doc), None
        except Exception as e:
            logger.exception("Get deck error")
            return None, str(e)

    @staticmethod
    def create_duel(challenger_id: str, opponent_id: str, deck_id: str):
        """Arkadaşa düello daveti gönderir."""
        try:
            db = get_firestore()
            duel_ref = db.collection(COLLECTION_DUELS).add({
                "challenger_id": challenger_id,
                "opponent_id": opponent_id,
                "deck_id": deck_id,
                "status": "pending", # pending, active, completed
                "created_at": firestore.SERVER_TIMESTAMP,
                "results": {
                    challenger_id: None,
                    opponent_id: None
                }
            })
            return duel_ref[1].id, None
        except Exception as e:
            logger.exception("Create duel error")
            return None, str(e)

    @staticmethod
    def submit_duel_result(duel_id: str, user_id: str, result_data: dict):
        """Düello sonucunu kaydeder."""
        try:
            db = get_firestore()
            duel_ref = db.collection(COLLECTION_DUELS).document(duel_id)
            duel_doc = duel_ref.get()
            
            if not duel_doc.exists:
                return False, "Düello bulunamadı."
            
            duel_data = duel_doc.to_dict()
            results = duel_data.get("results", {})
            results[user_id] = {
                **result_data,
                "submitted_at": datetime.utcnow().isoformat()
            }
            
            update_data = {"results": results}
            
            # Her iki taraf da tamamladıysa durumu güncelle
            if all(results.values()):
                update_data["status"] = "completed"
                # Winner logic (higher score, then lower time)
                u1, u2 = results.keys()
                res1, res2 = results[u1], results[u2]
                
                if res1["score"] > res2["score"]:
                    update_data["winner_id"] = u1
                elif res2["score"] > res1["score"]:
                    update_data["winner_id"] = u2
                else:
                    if res1["time_spent"] < res2["time_spent"]:
                        update_data["winner_id"] = u1
                    elif res2["time_spent"] < res1["time_spent"]:
                        update_data["winner_id"] = u2
                    else:
                        update_data["winner_id"] = "draw"

            duel_ref.update(update_data)
            return True, None
        except Exception as e:
            logger.exception("Submit duel result error")
            return False, str(e)

    @staticmethod
    def get_user_duels(user_id: str):
        """Kullanıcının düellolarını listeler."""
        try:
            db = get_firestore()
            # Challenger veya Opponent olduğu tüm düellolar
            q1 = db.collection(COLLECTION_DUELS).where("challenger_id", "==", user_id).get()
            q2 = db.collection(COLLECTION_DUELS).where("opponent_id", "==", user_id).get()
            
            duels = []
            for d in list(q1) + list(q2):
                duel_item = _doc_to_dict(d)
                # Deste adını ve rakip adını ekleyelim
                deck = db.collection(COLLECTION_DECKS).document(duel_item["deck_id"]).get()
                if deck.exists:
                    duel_item["deck_title"] = deck.to_dict().get("title", "Bilinmeyen Deste")
                
                other_id = duel_item["opponent_id"] if duel_item["challenger_id"] == user_id else duel_item["challenger_id"]
                other_user = db.collection("users").document(other_id).get()
                if other_user.exists:
                    duel_item["opponent_name"] = other_user.to_dict().get("name", "Bilinmeyen")
                
                duels.append(duel_item)
            
            return sorted(duels, key=lambda x: x["created_at"], reverse=True), None
        except Exception as e:
            logger.exception("Get user duels error")
            return None, str(e)

flashcard_service = FlashcardService()
