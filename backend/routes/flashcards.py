"""Flashcard multiplayer rotaları."""
from fastapi import APIRouter, HTTPException
from services.flashcard_service import flashcard_service
from schemas import (
    CreateDeckRequest,
    DuelChallengeRequest,
    DuelSubmissionRequest
)

flashcards_router = APIRouter()

@flashcards_router.post("/deck")
async def create_shared_deck(req: CreateDeckRequest):
    deck_id, error = flashcard_service.create_shared_deck(
        req.creator_id, req.title, req.subject, [c.model_dump() for c in req.cards]
    )
    if error:
        raise HTTPException(status_code=500, detail=error)
    return {"deck_id": deck_id}

@flashcards_router.get("/deck/{deck_id}")
async def get_deck(deck_id: str):
    deck, error = flashcard_service.get_deck(deck_id)
    if error:
        raise HTTPException(status_code=404, detail=error)
    return deck

@flashcards_router.post("/duel/challenge")
async def challenge_friend(req: DuelChallengeRequest):
    duel_id, error = flashcard_service.create_duel(
        req.challenger_id, req.opponent_id, req.deck_id
    )
    if error:
        raise HTTPException(status_code=500, detail=error)
    return {"duel_id": duel_id}

@flashcards_router.get("/duels/{user_id}")
async def get_user_duels(user_id: str):
    duels, error = flashcard_service.get_user_duels(user_id)
    if error:
        raise HTTPException(status_code=500, detail=error)
    return {"duels": duels}

@flashcards_router.post("/duel/complete")
async def complete_duel(req: DuelSubmissionRequest):
    success, error = flashcard_service.submit_duel_result(
        req.duel_id, req.user_id, {
            "score": req.score,
            "correct_count": req.correct_count,
            "total_count": req.total_count,
            "time_spent": req.time_spent
        }
    )
    if not success:
        raise HTTPException(status_code=400, detail=error)
    return {"message": "Sonuç kaydedildi."}
