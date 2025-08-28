import { NextResponse } from 'next/server';
import { getProject, updateFileContent, CounselMode } from '@/lib/counsel-reader';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ mode: string; name: string }> }
) {
  const { mode, name } = await params;
  const { searchParams } = new URL(request.url);
  const projectRoot = searchParams.get('root') || process.env.PROJECT_ROOT || process.cwd();
  const fileName = searchParams.get('file');
  
  if (!fileName) {
    return NextResponse.json(
      { error: 'File name is required' },
      { status: 400 }
    );
  }
  
  try {
    const project = await getProject(projectRoot, mode as CounselMode, name);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if file exists in project
    if (!project.files.includes(fileName)) {
      return NextResponse.json(
        { error: 'File not found in project' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const { content } = body;
    
    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content must be a string' },
        { status: 400 }
      );
    }
    
    await updateFileContent(project.path, fileName, content);
    
    return NextResponse.json({ 
      success: true,
      message: `File ${fileName} updated successfully` 
    });
  } catch (error) {
    console.error('Failed to update file:', error);
    return NextResponse.json(
      { error: 'Failed to update file', details: error },
      { status: 500 }
    );
  }
}