import random
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Transfer, Recommendation
from app.schemas import TransferCreateRequest, PaymentRequest, TransferResponse
from app.routers.serializers import serialize_transfer
from app.services.blockchain import blockchain_service

router = APIRouter(tags=["Transfers & Payments"])

@router.post("/transfer", response_model=TransferResponse, status_code=status.HTTP_201_CREATED)
def create_transfer(payload: TransferCreateRequest, db: Session = Depends(get_db)):
    """
    Initializes a new medicine transfer from an approved recommendation.
    Sets status to INITIATED, payment_status to PENDING.
    """
    rec = db.query(Recommendation).filter(Recommendation.recommendation_id == payload.recommendation_id).first()
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recommendation '{payload.recommendation_id}' not found"
        )

    transfer_id = f"TRF{random.randint(100, 999)}"

    new_transfer = Transfer(
        transfer_id=transfer_id,
        recommendation_id=payload.recommendation_id,
        status="INITIATED",
        payment_status="PENDING",
        transaction_id=None
    )
    db.add(new_transfer)
    rec.status = "APPROVED"
    db.commit()
    db.refresh(new_transfer)

    return serialize_transfer(new_transfer)

@router.post("/payment", response_model=TransferResponse)
def process_payment(payload: PaymentRequest, db: Session = Depends(get_db)):
    """
    Executes the decentralized settlement pipeline:
    x402 HTTP Payment Protocol -> GoPlausible Escrow Relay -> Algorand Testnet.
    Transitions transfer to COMPLETED and payment_status to CONFIRMED.
    """
    transfer = db.query(Transfer).filter(Transfer.transfer_id == payload.transfer_id).first()
    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transfer with ID '{payload.transfer_id}' not found"
        )

    # Process settlement via blockchain service
    rec = transfer.recommendation
    medicine_id = rec.medicine_id if rec else "MED001"
    quantity = rec.quantity if rec else 50

    receipt = blockchain_service.process_payment(
        transfer_id=transfer.transfer_id,
        medicine_id=medicine_id,
        quantity=quantity
    )

    transfer.status = receipt["status"]
    transfer.payment_status = receipt["payment_status"]
    transfer.transaction_id = receipt["transaction_id"]

    db.commit()
    db.refresh(transfer)

    return serialize_transfer(transfer)

@router.get("/transfer/{id}", response_model=TransferResponse)
def get_transfer_by_id(id: str, db: Session = Depends(get_db)):
    """
    Retrieves current status and on-chain verification ID for a transfer.
    """
    transfer = db.query(Transfer).filter(Transfer.transfer_id == id).first()
    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transfer '{id}' not found"
        )
    return serialize_transfer(transfer)

@router.get("/transfers", response_model=List[TransferResponse])
def get_all_transfers(db: Session = Depends(get_db)):
    """
    Returns list of all initiated or completed transfers.
    """
    transfers = db.query(Transfer).all()
    return [serialize_transfer(t) for t in transfers]
