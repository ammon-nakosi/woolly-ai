import { NextResponse } from 'next/server';
import { getProject, getFileContent, getPlanStatus, updatePlanStatus, CounselMode } from '@/lib/counsel-reader';
import path from 'path';
import os from 'os';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mode: string; name: string }> }
) {
  const { mode, name } = await params;
  const { searchParams } = new URL(request.url);
  const projectRoot = searchParams.get('root') || process.env.COUNSEL_DIR || path.join(os.homedir(), '.counsel');
  const file = searchParams.get('file');
  
  try {
    const project = await getProject(projectRoot, mode as CounselMode, name);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // If requesting specific file
    if (file) {
      const content = await getFileContent(project.path, file);
      return NextResponse.json({ content });
    }
    
    // Get plan status if it's a feature
    let planStatus = null;
    if (mode === 'feature') {
      planStatus = await getPlanStatus(project.path);
    }
    
    return NextResponse.json({
      ...project,
      planStatus
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read project', details: error },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ mode: string; name: string }> }
) {
  const { mode, name } = await params;
  const { searchParams } = new URL(request.url);
  const projectRoot = searchParams.get('root') || process.env.COUNSEL_DIR || path.join(os.homedir(), '.counsel');
  
  try {
    const project = await getProject(projectRoot, mode as CounselMode, name);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    if (body.planStatus) {
      await updatePlanStatus(project.path, body.planStatus);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { error: 'No valid update data provided' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update project', details: error },
      { status: 500 }
    );
  }
}