from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Surplus
from app.schemas import SurplusResponse
from app.routers.serializers import serialize_surplus

router = APIRouter(tags=["Surplus"])

@router.get("/surplus", response_model=List[SurplusResponse])
def get_surplus(db: Session = Depends(get_db)):
    """
    Returns available surplus medicine stock across all connected network facilities.
    """
    surplus_items = db.query(Surplus).filter(Surplus.status == "AVAILABLE").all()
    return [serialize_surplus(s) for s in surplus_items]
