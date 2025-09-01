import { NextResponse } from 'next/server';
import { getRules } from '@/lib/library-reader';

export async function GET() {
  try {
    const rules = await getRules();
    return NextResponse.json(rules);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch rules', details: error },
      { status: 500 }
    );
  }
}