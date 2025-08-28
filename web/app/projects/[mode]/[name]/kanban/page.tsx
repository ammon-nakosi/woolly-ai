import { redirect } from 'next/navigation';

interface KanbanRedirectProps {
  params: Promise<{ mode: string; name: string }>;
}

export default async function KanbanRedirect({ params }: KanbanRedirectProps) {
  const { mode, name } = await params;
  redirect(`/projects/${mode}/${name}/kanban/top-level`);
}