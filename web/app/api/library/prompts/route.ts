import { NextResponse } from 'next/server';
import { getPrompts } from '@/lib/library-reader';

export async function GET() {
  try {
    const prompts = await getPrompts();
    return NextResponse.json(prompts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch prompts', details: error },
      { status: 500 }
    );
  }
}