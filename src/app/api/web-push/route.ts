import { NextResponse } from 'next/server';

// In a production environment, you would store subscriptions in a database
let subscriptions: PushSubscription[] = [];

export async function POST(request: Request) {
  try {
    const subscription = await request.json();
    
    // Store the subscription (in production, store in a database)
    subscriptions.push(subscription);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to subscribe' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const subscription = await request.json();
    
    // Remove the subscription (in production, remove from database)
    subscriptions = subscriptions.filter(sub => 
      sub.endpoint !== subscription.endpoint
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to unsubscribe' }, { status: 500 });
  }
}