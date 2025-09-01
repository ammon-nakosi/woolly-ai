import { NextResponse } from 'next/server';
import { getPrompt, updatePrompt, deletePrompt } from '@/lib/library-reader';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const prompt = await getPrompt(params.id);
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(prompt);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch prompt', details: error },
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
    const success = await updatePrompt(params.id, updates);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update prompt' },
        { status: 400 }
      );
    }
    
    const updatedPrompt = await getPrompt(params.id);
    return NextResponse.json(updatedPrompt);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update prompt', details: error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deletePrompt(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete prompt' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete prompt', details: error },
      { status: 500 }
    );
  }
}