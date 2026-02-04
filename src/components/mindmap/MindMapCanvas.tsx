import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMindMap } from '@/hooks/useMindMap';
import MindMapNode from './MindMapNode';
import MindMapToolbar from './MindMapToolbar';
import { Loader2 } from 'lucide-react';

interface MindMapCanvasProps {
  mapId: string;
}

const nodeTypes = {
  mindMapNode: MindMapNode,
};

const MindMapCanvasInner = ({ mapId }: MindMapCanvasProps) => {
  const {
    map,
    nodes,
    edges,
    isLoading,
    isSaving,
    fetchMap,
    updateMapTitle,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNodeContent,
    updateNodeColor,
    deleteSelectedNodes,
  } = useMindMap(mapId);

  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    if (mapId) {
      fetchMap(mapId);
    }
  }, [mapId, fetchMap]);

  // Listen for node content updates from child components
  useEffect(() => {
    const handleUpdateContent = (e: CustomEvent<{ nodeId: string; content: string }>) => {
      updateNodeContent(e.detail.nodeId, e.detail.content);
    };

    window.addEventListener('mindmap:updateNodeContent', handleUpdateContent as EventListener);
    return () => {
      window.removeEventListener('mindmap:updateNodeContent', handleUpdateContent as EventListener);
    };
  }, [updateNodeContent]);

  // Handle selection changes
  const handleSelectionChange = useCallback(
    ({ nodes: selectedFlowNodes }: { nodes: Node[] }) => {
      setSelectedNodes(selectedFlowNodes.map((n) => n.id));
    },
    []
  );

  // Handle double-click to add node
  const handlePaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNode(position);
    },
    [screenToFlowPosition, addNode]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodes.length > 0 && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          deleteSelectedNodes(selectedNodes);
          setSelectedNodes([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, deleteSelectedNodes]);

  const handleAddNode = useCallback(() => {
    addNode({ x: 400, y: 300 });
  }, [addNode]);

  const handleDeleteSelected = useCallback(() => {
    deleteSelectedNodes(selectedNodes);
    setSelectedNodes([]);
  }, [selectedNodes, deleteSelectedNodes]);

  const handleColorChange = useCallback(
    (color: string) => {
      selectedNodes.forEach((nodeId) => {
        updateNodeColor(nodeId, color);
      });
    },
    [selectedNodes, updateNodeColor]
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      if (map) {
        updateMapTitle(map.id, title);
      }
    },
    [map, updateMapTitle]
  );

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <MindMapToolbar
        title={map?.title || ''}
        onTitleChange={handleTitleChange}
        onAddNode={handleAddNode}
        onDeleteSelected={handleDeleteSelected}
        onColorChange={handleColorChange}
        selectedNodeId={selectedNodes[0] || null}
        isSaving={isSaving}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={handleSelectionChange}
        onDoubleClick={handlePaneDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { strokeWidth: 2, stroke: '#94a3b8' },
        }}
        connectionLineStyle={{ strokeWidth: 2, stroke: '#3b82f6' }}
        deleteKeyCode={null} // Handle delete manually
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        panOnDrag={[1, 2]} // Middle mouse or right mouse
        selectionMode={"partial" as any}
        className="bg-slate-50"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        <Controls className="!bg-white !shadow-lg !border !rounded-lg" />
        <MiniMap
          className="!bg-white !shadow-lg !border !rounded-lg"
          nodeColor={(node) => (node.data as { color?: string })?.color || '#3b82f6'}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
};

const MindMapCanvas = (props: MindMapCanvasProps) => (
  <ReactFlowProvider>
    <MindMapCanvasInner {...props} />
  </ReactFlowProvider>
);

export default MindMapCanvas;
