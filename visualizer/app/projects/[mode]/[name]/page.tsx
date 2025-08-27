import { redirect } from 'next/navigation';

interface ProjectRedirectProps {
  params: Promise<{ mode: string; name: string }>;
}

export default async function ProjectRedirect({ params }: ProjectRedirectProps) {
  const { mode, name } = await params;
  redirect(`/projects/${mode}/${name}/overview`);
}