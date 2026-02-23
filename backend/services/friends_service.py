"""Arkadaşlar sistemi servisi (Firestore)."""
import logging
from datetime import datetime
from firebase_admin import firestore
from firebase_db import get_firestore

logger = logging.getLogger(__name__)

COLLECTION_FRIENDS = "friends"  # friendship documents {users: [uid1, uid2], created_at: ...}
COLLECTION_REQUESTS = "friend_requests" # {from: uid1, to: uid2, status: 'pending', created_at: ...}
COLLECTION_USERS = "users"

def _doc_to_dict(doc) -> dict:
    data = doc.to_dict()
    data["id"] = doc.id
    for key, val in data.items():
        if hasattr(val, "isoformat"):
            data[key] = val.isoformat()
    return data

class FriendsService:
    @staticmethod
    def search_users(query: str, current_user_id: str):
        """Kullanıcıları isim veya e-posta ile arar."""
        try:
            db = get_firestore()
            # Firestore handles only prefix search easily. This is a simple implementation.
            # In a real app, we might use Algolia or a more flexible search.
            
            # Search by name
            users_ref = db.collection(COLLECTION_USERS)
            
            # Case sensitive startswith search
            query_end = query + '\uf8ff'
            
            name_hits = users_ref.where("name", ">=", query).where("name", "<=", query_end).limit(20).get()
            email_hits = users_ref.where("email", ">=", query).where("email", "<=", query_end).limit(20).get()
            
            results = {}
            for doc in name_hits:
                if doc.id != current_user_id:
                    results[doc.id] = _doc_to_dict(doc)
            
            for doc in email_hits:
                if doc.id != current_user_id:
                    results[doc.id] = _doc_to_dict(doc)
            
            return list(results.values()), None
        except Exception as e:
            logger.exception("User search error")
            return None, str(e)

    @staticmethod
    def send_friend_request(sender_id: str, receiver_id: str):
        """Arkadaşlık isteği gönderir."""
        try:
            db = get_firestore()
            
            # Check if already friends
            friendship = db.collection(COLLECTION_FRIENDS).where("users", "array_contains", sender_id).get()
            for f in friendship:
                if receiver_id in f.to_dict()["users"]:
                    return False, "Zaten arkadaşsınız."
            
            # Check if request already pending
            existing = db.collection(COLLECTION_REQUESTS)\
                        .where("from", "==", sender_id)\
                        .where("to", "==", receiver_id)\
                        .where("status", "==", "pending").get()
            if existing:
                return False, "İstek zaten gönderilmiş."
            
            # Reverse request check
            rev = db.collection(COLLECTION_REQUESTS)\
                    .where("from", "==", receiver_id)\
                    .where("to", "==", sender_id)\
                    .where("status", "==", "pending").get()
            if rev:
                return False, "Karşı taraftan gelen bir istek zaten var."

            db.collection(COLLECTION_REQUESTS).add({
                "from": sender_id,
                "to": receiver_id,
                "status": "pending",
                "created_at": firestore.SERVER_TIMESTAMP
            })
            return True, None
        except Exception as e:
            logger.exception("Send friend request error")
            return False, str(e)

    @staticmethod
    def get_pending_requests(user_id: str):
        """Bekleyen arkadaşlık isteklerini getirir."""
        try:
            db = get_firestore()
            # Gelen istekler
            incoming = db.collection(COLLECTION_REQUESTS).where("to", "==", user_id).where("status", "==", "pending").get()
            
            results = []
            for doc in incoming:
                req_data = _doc_to_dict(doc)
                # Sender details
                sender = db.collection(COLLECTION_USERS).document(req_data["from"]).get()
                if sender.exists:
                    req_data["sender"] = _doc_to_dict(sender)
                results.append(req_data)
            
            return results, None
        except Exception as e:
            logger.exception("Get pending requests error")
            return None, str(e)

    @staticmethod
    def respond_to_request(request_id: str, action: str):
        """İsteği kabul et veya reddet."""
        try:
            db = get_firestore()
            req_ref = db.collection(COLLECTION_REQUESTS).document(request_id)
            req_doc = req_ref.get()
            
            if not req_doc.exists:
                return False, "İstek bulunamadı."
            
            req_data = req_doc.to_dict()
            if req_data["status"] != "pending":
                return False, "İstek zaten işlenmiş."
            
            if action == "accept":
                # Create friendship
                db.collection(COLLECTION_FRIENDS).add({
                    "users": [req_data["from"], req_data["to"]],
                    "created_at": firestore.SERVER_TIMESTAMP
                })
                req_ref.update({"status": "accepted"})
            else:
                req_ref.update({"status": "declined"})
            
            return True, None
        except Exception as e:
            logger.exception("Respond to request error")
            return False, str(e)

    @staticmethod
    def get_friends(user_id: str):
        """Arkadaş listesini getirir."""
        try:
            db = get_firestore()
            friendships = db.collection(COLLECTION_FRIENDS).where("users", "array_contains", user_id).get()
            
            friends = []
            for f in friendships:
                data = f.to_dict()
                other_uid = [u for u in data["users"] if u != user_id][0]
                
                user_doc = db.collection(COLLECTION_USERS).document(other_uid).get()
                if user_doc.exists:
                    friends.append(_doc_to_dict(user_doc))
            
            return friends, None
        except Exception as e:
            logger.exception("Get friends error")
            return None, str(e)

    @staticmethod
    def remove_friend(user_id: str, friend_uid: str):
        """Arkadaşı siler."""
        try:
            db = get_firestore()
            friendships = db.collection(COLLECTION_FRIENDS).where("users", "array_contains", user_id).get()
            
            found = False
            for f in friendships:
                if friend_uid in f.to_dict()["users"]:
                    f.reference.delete()
                    found = True
            
            if found:
                return True, None
            return False, "Arkadaşlık bulunamadı."
        except Exception as e:
            logger.exception("Remove friend error")
            return False, str(e)

friends_service = FriendsService()
