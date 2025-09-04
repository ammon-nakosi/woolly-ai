'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CounselProject } from '@/lib/woolly-reader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  FolderOpen, 
  FileText, 
  BookOpen, 
  ChevronRight, 
  ArrowUpDown,
  Code2,
  Sparkles,
  Terminal,
  BookOpenCheck,
  RefreshCw
} from 'lucide-react';

type SortField = 'name' | 'mode' | 'modified' | 'created';
type SortOrder = 'asc' | 'desc';

const modeIcons = {
  feature: <Code2 className="w-4 h-4" />,
  script: <Terminal className="w-4 h-4" />,
  vibe: <Sparkles className="w-4 h-4" />,
  prompt: <FileText className="w-4 h-4" />
};

const modeColors = {
  feature: 'default' as const,
  script: 'secondary' as const,
  vibe: 'outline' as const,
  prompt: 'destructive' as const
};

export default function ModernHomePage() {
  const [projects, setProjects] = useState<CounselProject[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('modified');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [libraryView, setLibraryView] = useState<'rules' | 'prompts'>('rules');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProjects(), fetchLibrary()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchLibrary = async () => {
    try {
      const [rulesRes, promptsRes] = await Promise.all([
        fetch('/api/library/rules'),
        fetch('/api/library/prompts')
      ]);
      const rulesData = await rulesRes.json();
      const promptsData = await promptsRes.json();
      setRules(rulesData);
      setPrompts(promptsData);
    } catch (error) {
      console.error('Failed to fetch library:', error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesMode = filterMode === 'all' || project.mode === filterMode;
    const matchesSearch = searchQuery === '' || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMode && matchesSearch;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'modified' || sortField === 'created') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Woolly Framework</h1>
                <p className="text-muted-foreground mt-2">
                  Manage your projects, scripts, and creative explorations
                </p>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => window.location.reload()}
                className="rounded-full"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Projects</CardDescription>
                  <CardTitle className="text-2xl">{projects.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Features</CardDescription>
                  <CardTitle className="text-2xl">
                    {projects.filter(p => p.mode === 'feature').length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Scripts</CardDescription>
                  <CardTitle className="text-2xl">
                    {projects.filter(p => p.mode === 'script').length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Vibes</CardDescription>
                  <CardTitle className="text-2xl">
                    {projects.filter(p => p.mode === 'vibe').length}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookOpenCheck className="w-4 h-4" />
              Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterMode} onValueChange={setFilterMode}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modes</SelectItem>
                      <SelectItem value="feature">Features</SelectItem>
                      <SelectItem value="script">Scripts</SelectItem>
                      <SelectItem value="vibe">Vibes</SelectItem>
                      <SelectItem value="prompt">Prompts</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
                    const [field, order] = value.split('-') as [SortField, SortOrder];
                    setSortField(field);
                    setSortOrder(order);
                  }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modified-desc">Recently Modified</SelectItem>
                      <SelectItem value="modified-asc">Oldest Modified</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="created-desc">Recently Created</SelectItem>
                      <SelectItem value="created-asc">Oldest Created</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
            </Card>

            {/* Projects Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedProjects.map((project) => (
                  <Link
                    key={`${project.mode}-${project.name}`}
                    href={`/projects/${project.mode}/${project.name}`}
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {modeIcons[project.mode as keyof typeof modeIcons]}
                              {project.name}
                            </CardTitle>
                            <CardDescription className="mt-2 line-clamp-2">
                              {project.metadata?.description || 'No description available'}
                            </CardDescription>
                          </div>
                          <Badge variant={modeColors[project.mode as keyof typeof modeColors]}>
                            {project.mode}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(project.modified).toLocaleDateString()}
                          </div>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {sortedProjects.length === 0 && !loading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No projects found matching your criteria
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <Tabs value={libraryView} onValueChange={(v) => setLibraryView(v as 'rules' | 'prompts')}>
              <TabsList>
                <TabsTrigger value="rules">
                  Rules ({rules.length})
                </TabsTrigger>
                <TabsTrigger value="prompts">
                  Prompts ({prompts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="rules" className="mt-4">
                <div className="grid gap-4">
                  {rules.map((rule, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{rule.title}</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="outline">{rule.type}</Badge>
                            <Badge variant="secondary">{rule.scope}</Badge>
                          </div>
                        </div>
                        <CardDescription>
                          {rule.description || 'No description available'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Updated: {new Date(rule.updated).toLocaleDateString()}</span>
                          {rule.project && (
                            <Badge variant="outline" className="text-xs">
                              {rule.project}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="prompts" className="mt-4">
                <div className="grid gap-4">
                  {prompts.map((prompt, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{prompt.name}</CardTitle>
                          <Badge>{prompt.version || 'v1.0'}</Badge>
                        </div>
                        <CardDescription>
                          {prompt.description || 'No description available'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {prompt.tags?.map((tag: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}