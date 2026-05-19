import os
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import User as UserModel
from services.auth_service import get_current_user

router = APIRouter(
    prefix="/api/stripe",
    tags=["Stripe Payments"]
)

# Use dummy keys for local development if real ones aren't provided
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_dummy")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_dummy")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

@router.post("/create-checkout-session")
async def create_checkout_session(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if stripe.api_key == "sk_test_dummy":
            # Mock the Stripe response for local testing without real keys
            # Instantly upgrade the user so they can test Pro features
            current_user.subscription = "pro"
            db.commit()
            return {"url": f"{FRONTEND_URL}/dashboard?success=true&mock=true"}
            
        # In a real app, you'd use a real Price ID from your Stripe Dashboard
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'usd',
                        'unit_amount': 2900,  # $29.00
                        'product_data': {
                            'name': 'HireReady Pro Subscription',
                            'description': 'Unlimited AI Mock Interviews & Advanced Feedback',
                        },
                    },
                    'quantity': 1,
                },
            ],
            mode='payment', # or 'subscription' for recurring
            success_url=f"{FRONTEND_URL}/dashboard?success=true",
            cancel_url=f"{FRONTEND_URL}/upgrade?canceled=true",
            client_reference_id=str(current_user.id),
            customer_email=current_user.email,
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature")

    try:
        # If dummy webhook secret, we skip signature validation for local testing
        if STRIPE_WEBHOOK_SECRET == "whsec_dummy":
            event = stripe.Event.construct_from(
                import_json_parser(payload), stripe.api_key
            )
        else:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Fulfill the purchase...
        user_id_str = session.get("client_reference_id")
        if user_id_str:
            user = db.query(UserModel).filter(UserModel.id == int(user_id_str)).first()
            if user:
                user.subscription = "pro"
                db.commit()
                print(f"User {user.email} upgraded to PRO via Stripe.")

    return {"status": "success"}

def import_json_parser(payload):
    import json
    return json.loads(payload.decode('utf-8'))
