import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface MindMapNodeData {
  label?: string;
  color?: string;
}

const MindMapNode = ({ data, selected, id }: NodeProps) => {
  const nodeData = data as MindMapNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData.label || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const color = nodeData.color || '#3b82f6';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(nodeData.label || '');
  }, [nodeData.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    // Dispatch custom event to update node content
    window.dispatchEvent(
      new CustomEvent('mindmap:updateNodeContent', {
        detail: { nodeId: id, content: editValue },
      })
    );
  }, [id, editValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleBlur();
      }
      if (e.key === 'Escape') {
        setIsEditing(false);
        setEditValue(nodeData.label || '');
      }
    },
    [handleBlur, nodeData.label]
  );

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-200 min-w-[120px] max-w-[280px]',
        selected ? 'ring-2 ring-offset-2 ring-primary shadow-xl scale-105' : ''
      )}
      style={{
        backgroundColor: color,
        borderColor: color,
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-white !border-2"
        style={{ borderColor: color }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-white !border-2"
        style={{ borderColor: color }}
      />

      {isEditing ? (
        <textarea
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-white placeholder-white/70 outline-none resize-none text-center font-medium"
          rows={2}
          placeholder="Enter text..."
        />
      ) : (
        <div className="text-white font-medium text-center break-words">
          {nodeData.label || 'Double-click to edit'}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-white !border-2"
        style={{ borderColor: color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-white !border-2"
        style={{ borderColor: color }}
      />
    </div>
  );
};

export default memo(MindMapNode);
