import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Save,
  ArrowLeft,
  Palette,
  Loader2,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useReactFlow } from '@xyflow/react';
import { Link } from 'react-router-dom';

interface MindMapToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  onAddNode: () => void;
  onDeleteSelected: () => void;
  onColorChange: (color: string) => void;
  selectedNodeId: string | null;
  isSaving: boolean;
}

const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
];

const MindMapToolbar = memo(({
  title,
  onTitleChange,
  onAddNode,
  onDeleteSelected,
  onColorChange,
  selectedNodeId,
  isSaving,
}: MindMapToolbarProps) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-4">
      {/* Left side - Back & Title */}
      <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2">
        <Link to="/mindmap">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="border-0 bg-transparent font-semibold text-lg w-48 focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Mind Map Title"
        />
        {isSaving && (
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
      </div>

      {/* Right side - Tools */}
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onAddNode}
          title="Add Node (Double-click canvas)"
        >
          <Plus className="h-4 w-4" />
        </Button>

        {selectedNodeId && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Change Color">
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="end">
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => onColorChange(color)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDeleteSelected}
              title="Delete Selected"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => zoomIn()}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => zoomOut()}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => fitView({ padding: 0.2 })}
          title="Fit View"
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

MindMapToolbar.displayName = 'MindMapToolbar';

export default MindMapToolbar;
