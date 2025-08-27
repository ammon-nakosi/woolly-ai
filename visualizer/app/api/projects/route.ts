import { NextResponse } from 'next/server';
import { getCounselProjects } from '@/lib/counsel-reader';
import path from 'path';
import os from 'os';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Default to ~/.counsel directory for user's counsel projects
  const projectRoot = searchParams.get('root') || process.env.COUNSEL_DIR || path.join(os.homedir(), '.counsel');
  
  try {
    const projects = await getCounselProjects(projectRoot);
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read projects', details: error },
      { status: 500 }
    );
  }
}