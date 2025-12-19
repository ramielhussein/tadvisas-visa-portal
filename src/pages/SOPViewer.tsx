import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronDown, FileText, FolderOpen, ArrowLeft, Home, Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SOPPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  parent_id: string | null;
  sort_order: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface TreeNode extends SOPPage {
  children: TreeNode[];
}

// Simple markdown-like rendering (basic support)
function renderContent(content: string) {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      elements.push(
        <ListTag key={elements.length} className={listType === 'ol' ? 'list-decimal ml-6 my-2' : 'list-disc ml-6 my-2'}>
          {listItems.map((item, i) => <li key={i} className="my-1">{item}</li>)}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line, index) => {
    // Headers
    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h1 key={index} className="text-3xl font-bold mt-6 mb-4">{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={index} className="text-2xl font-semibold mt-5 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={index} className="text-xl font-medium mt-4 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith('#### ')) {
      flushList();
      elements.push(<h4 key={index} className="text-lg font-medium mt-3 mb-2">{line.slice(5)}</h4>);
    }
    // Unordered list
    else if (line.match(/^[-*] /)) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(line.slice(2));
    }
    // Ordered list
    else if (line.match(/^\d+\. /)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(line.replace(/^\d+\. /, ''));
    }
    // Horizontal rule
    else if (line.match(/^---+$/)) {
      flushList();
      elements.push(<hr key={index} className="my-4 border-border" />);
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={index} className="border-l-4 border-primary pl-4 italic my-3 text-muted-foreground">
          {line.slice(2)}
        </blockquote>
      );
    }
    // Code block (inline)
    else if (line.startsWith('```')) {
      // Skip code fence markers for now
    }
    // Empty line
    else if (line.trim() === '') {
      flushList();
    }
    // Regular paragraph
    else {
      flushList();
      // Handle bold and italic
      let processed = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>');
      elements.push(
        <p key={index} className="my-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: processed }} />
      );
    }
  });

  flushList();
  return elements;
}

function buildTree(pages: SOPPage[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Create nodes
  pages.forEach(page => {
    map.set(page.id, { ...page, children: [] });
  });

  // Build tree
  pages.forEach(page => {
    const node = map.get(page.id)!;
    if (page.parent_id && map.has(page.parent_id)) {
      map.get(page.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort children by sort_order
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    nodes.forEach(node => sortNodes(node.children));
  };
  sortNodes(roots);

  return roots;
}

function TreeItem({ node, currentSlug, level = 0 }: { node: TreeNode; currentSlug?: string; level?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isActive = node.slug === currentSlug;

  return (
    <div>
      <div 
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
          isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5 hover:bg-muted rounded">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground" />
        )}
        <Link to={`/sop/${node.slug}`} className="flex-1 truncate text-sm">
          {node.title}
        </Link>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeItem key={child.id} node={child} currentSlug={currentSlug} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// Highlight matched terms in text
function highlightText(text: string, query: string): JSX.Element {
  if (!query.trim()) return <>{text}</>;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// Search result item component
function SearchResult({ page, query, onClick }: { page: SOPPage; query: string; onClick: () => void }) {
  // Get a snippet of content around the first match
  const getSnippet = (content: string, searchQuery: string): string => {
    const lowerContent = content.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const matchIndex = lowerContent.indexOf(lowerQuery);
    
    if (matchIndex === -1) return content.slice(0, 100) + '...';
    
    const start = Math.max(0, matchIndex - 40);
    const end = Math.min(content.length, matchIndex + searchQuery.length + 60);
    
    let snippet = content.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet.replace(/\n/g, ' ');
  };

  return (
    <Link
      to={`/sop/${page.slug}`}
      onClick={onClick}
      className="block p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
    >
      <h4 className="font-medium text-sm">
        {highlightText(page.title, query)}
      </h4>
      {page.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {highlightText(page.description, query)}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {highlightText(getSnippet(page.content, query), query)}
      </p>
    </Link>
  );
}

export default function SOPViewer() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [pages, setPages] = useState<SOPPage[]>([]);
  const [currentPage, setCurrentPage] = useState<SOPPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Filter pages based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return pages.filter(page => 
      page.title.toLowerCase().includes(query) ||
      (page.description && page.description.toLowerCase().includes(query)) ||
      page.content.toLowerCase().includes(query)
    );
  }, [searchQuery, pages]);

  useEffect(() => {
    const fetchPages = async () => {
      const { data, error } = await supabase
        .from('sop_pages')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching SOP pages:', error);
      } else {
        setPages(data || []);
      }
    };

    fetchPages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('sop-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sop_pages' }, () => {
        fetchPages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (slug && pages.length > 0) {
      const page = pages.find(p => p.slug === slug);
      setCurrentPage(page || null);
      setLoading(false);
    } else if (!slug && pages.length > 0) {
      // Navigate to first page if no slug
      const roots = buildTree(pages);
      if (roots.length > 0) {
        navigate(`/sop/${roots[0].slug}`, { replace: true });
      }
      setLoading(false);
    } else if (pages.length > 0) {
      setLoading(false);
    }
  }, [slug, pages, navigate]);

  const tree = buildTree(pages);

  // Get breadcrumb path
  const getBreadcrumbs = (page: SOPPage): SOPPage[] => {
    const path: SOPPage[] = [page];
    let current = page;
    while (current.parent_id) {
      const parent = pages.find(p => p.id === current.parent_id);
      if (parent) {
        path.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    return path;
  };

  const breadcrumbs = currentPage ? getBreadcrumbs(currentPage) : [];

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-72 border-r p-4">
          <Skeleton className="h-8 w-full mb-4" />
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-6 w-full mb-2" />
          ))}
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-10 w-1/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-72 border-r flex flex-col">
        <div className="p-4 border-b space-y-3">
          <Link to="/sop" className="flex items-center gap-2 font-semibold text-lg">
            <FolderOpen className="h-5 w-5" />
            SOP Manual
          </Link>
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search SOPs..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.trim().length > 0);
              }}
              className="pl-8 pr-8 h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-2">
          {/* Show search results or tree */}
          {showSearchResults && searchQuery.trim() ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground px-2 py-1">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </p>
              {searchResults.length > 0 ? (
                searchResults.map(page => (
                  <SearchResult
                    key={page.id}
                    page={page}
                    query={searchQuery}
                    onClick={() => {
                      setShowSearchResults(false);
                      setSearchQuery("");
                    }}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  No matching SOPs found.
                </p>
              )}
            </div>
          ) : (
            <>
              {tree.map(node => (
                <TreeItem key={node.id} node={node} currentSlug={slug} />
              ))}
              {tree.length === 0 && (
                <p className="text-sm text-muted-foreground p-4">No SOP pages found.</p>
              )}
            </>
          )}
        </ScrollArea>
        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/hub')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hub
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {currentPage ? (
          <div className="max-w-4xl mx-auto p-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
              <Link to="/sop" className="hover:text-foreground">
                <Home className="h-4 w-4" />
              </Link>
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  <ChevronRight className="h-4 w-4" />
                  {i === breadcrumbs.length - 1 ? (
                    <span className="text-foreground font-medium">{crumb.title}</span>
                  ) : (
                    <Link to={`/sop/${crumb.slug}`} className="hover:text-foreground">
                      {crumb.title}
                    </Link>
                  )}
                </span>
              ))}
            </nav>

            {/* Page content */}
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <h1 className="text-3xl font-bold mb-2">{currentPage.title}</h1>
              {currentPage.description && (
                <p className="text-lg text-muted-foreground mb-6">{currentPage.description}</p>
              )}
              <div className="mt-6">
                {renderContent(currentPage.content)}
              </div>
            </article>

            {/* Last updated */}
            <div className="mt-12 pt-6 border-t text-sm text-muted-foreground">
              Last updated: {new Date(currentPage.updated_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>SOP Manual</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {pages.length > 0 
                    ? "Select a page from the sidebar to view its content."
                    : "No SOP pages have been published yet."}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
