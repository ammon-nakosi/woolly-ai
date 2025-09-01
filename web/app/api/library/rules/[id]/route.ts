import { NextResponse } from 'next/server';
import { getRule, updateRule, deleteRule } from '@/lib/library-reader';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rule = await getRule(params.id);
    if (!rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(rule);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch rule', details: error },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    const success = await updateRule(params.id, updates);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update rule' },
        { status: 400 }
      );
    }
    
    const updatedRule = await getRule(params.id);
    return NextResponse.json(updatedRule);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update rule', details: error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteRule(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete rule' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete rule', details: error },
      { status: 500 }
    );
  }
}