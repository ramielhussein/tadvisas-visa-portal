import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Node, Edge, useNodesState, useEdgesState, addEdge, Connection } from '@xyflow/react';
import { useToast } from '@/hooks/use-toast';
import { debounce } from '@/lib/utils';

export interface MindMap {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export const useMindMap = (mapId?: string) => {
  const [map, setMap] = useState<MindMap | null>(null);
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch all maps for the user
  const fetchMaps = useCallback(async () => {
    const { data, error } = await supabase
      .from('mind_maps')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching maps:', error);
      return;
    }

    setMaps(data || []);
  }, []);

  // Fetch a specific map with nodes and edges
  const fetchMap = useCallback(async (id: string) => {
    setIsLoading(true);

    const { data: mapData, error: mapError } = await supabase
      .from('mind_maps')
      .select('*')
      .eq('id', id)
      .single();

    if (mapError) {
      toast({
        title: 'Error',
        description: 'Failed to load mind map',
        variant: 'destructive',
      });
      navigate('/mindmap');
      return;
    }

    setMap(mapData);

    // Fetch nodes
    const { data: nodesData } = await supabase
      .from('mind_map_nodes')
      .select('*')
      .eq('map_id', id);

    // Fetch edges
    const { data: edgesData } = await supabase
      .from('mind_map_edges')
      .select('*')
      .eq('map_id', id);

    // Convert to React Flow format
    const flowNodes: Node[] = (nodesData || []).map((node) => ({
      id: node.node_id,
      position: { x: Number(node.position_x), y: Number(node.position_y) },
      data: { label: node.content, color: node.color },
      type: node.node_type || 'mindMapNode',
      style: { width: node.width ? Number(node.width) : undefined },
    }));

    const flowEdges: Edge[] = (edgesData || []).map((edge) => ({
      id: edge.edge_id,
      source: edge.source_node_id,
      target: edge.target_node_id,
      label: edge.label || undefined,
      type: edge.edge_type || 'smoothstep',
      animated: edge.animated || false,
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
    setIsLoading(false);
  }, [navigate, toast, setNodes, setEdges]);

  // Create a new map
  const createMap = useCallback(async (title: string = 'Untitled Mind Map') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('mind_maps')
      .insert({ owner_id: user.id, title })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create mind map',
        variant: 'destructive',
      });
      return null;
    }

    // Create initial center node
    const initialNodeId = `node-${Date.now()}`;
    await supabase.from('mind_map_nodes').insert({
      map_id: data.id,
      node_id: initialNodeId,
      position_x: 400,
      position_y: 300,
      content: 'Central Idea',
      color: '#3b82f6',
      node_type: 'mindMapNode',
    });

    toast({
      title: 'Created!',
      description: 'New mind map created',
    });

    return data;
  }, [toast]);

  // Delete a map
  const deleteMap = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('mind_maps')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete mind map',
        variant: 'destructive',
      });
      return false;
    }

    setMaps((prev) => prev.filter((m) => m.id !== id));
    toast({
      title: 'Deleted',
      description: 'Mind map deleted',
    });
    return true;
  }, [toast]);

  // Update map title
  const updateMapTitle = useCallback(async (id: string, title: string) => {
    const { error } = await supabase
      .from('mind_maps')
      .update({ title })
      .eq('id', id);

    if (error) {
      console.error('Error updating title:', error);
      return;
    }

    setMap((prev) => prev ? { ...prev, title } : null);
  }, []);

  // Save nodes to database (debounced)
  const saveNodes = useCallback(
    debounce(async (mapId: string, nodesToSave: Node[]) => {
      setIsSaving(true);
      
      // Delete existing nodes and insert new ones (simpler than upsert for this case)
      await supabase.from('mind_map_nodes').delete().eq('map_id', mapId);
      
      if (nodesToSave.length > 0) {
        const nodesData = nodesToSave.map((node) => ({
          map_id: mapId,
          node_id: node.id,
          position_x: node.position.x,
          position_y: node.position.y,
          content: (node.data as { label?: string })?.label || '',
          color: (node.data as { color?: string })?.color || '#3b82f6',
          node_type: node.type || 'mindMapNode',
          width: node.width,
          height: node.height,
        }));

        await supabase.from('mind_map_nodes').insert(nodesData);
      }
      
      setIsSaving(false);
    }, 500),
    []
  );

  // Save edges to database (debounced)
  const saveEdges = useCallback(
    debounce(async (mapId: string, edgesToSave: Edge[]) => {
      setIsSaving(true);
      
      await supabase.from('mind_map_edges').delete().eq('map_id', mapId);
      
      if (edgesToSave.length > 0) {
        const edgesData = edgesToSave.map((edge) => ({
          map_id: mapId,
          edge_id: edge.id,
          source_node_id: edge.source,
          target_node_id: edge.target,
          label: edge.label as string | null,
          edge_type: edge.type || 'smoothstep',
          animated: edge.animated || false,
        }));

        await supabase.from('mind_map_edges').insert(edgesData);
      }
      
      setIsSaving(false);
    }, 500),
    []
  );

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `edge-${Date.now()}`,
        type: 'smoothstep',
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Add new node
  const addNode = useCallback((position: { x: number; y: number }, content: string = 'New Idea') => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      position,
      data: { label: content, color: '#3b82f6' },
      type: 'mindMapNode',
    };
    setNodes((nds) => [...nds, newNode]);
    return newNode;
  }, [setNodes]);

  // Update node content
  const updateNodeContent = useCallback((nodeId: string, content: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label: content } }
          : node
      )
    );
  }, [setNodes]);

  // Update node color
  const updateNodeColor = useCallback((nodeId: string, color: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, color } }
          : node
      )
    );
  }, [setNodes]);

  // Delete selected nodes
  const deleteSelectedNodes = useCallback((nodeIds: string[]) => {
    setNodes((nds) => nds.filter((node) => !nodeIds.includes(node.id)));
    setEdges((eds) =>
      eds.filter(
        (edge) => !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
      )
    );
  }, [setNodes, setEdges]);

  // Real-time subscription for collaboration
  useEffect(() => {
    if (!mapId) return;

    const nodesChannel = supabase
      .channel(`mind_map_nodes:${mapId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mind_map_nodes',
          filter: `map_id=eq.${mapId}`,
        },
        (payload) => {
          // Refresh nodes on changes from other users
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // For now, just refetch - can be optimized later
            fetchMap(mapId);
          }
        }
      )
      .subscribe();

    const edgesChannel = supabase
      .channel(`mind_map_edges:${mapId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mind_map_edges',
          filter: `map_id=eq.${mapId}`,
        },
        () => {
          fetchMap(mapId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(nodesChannel);
      supabase.removeChannel(edgesChannel);
    };
  }, [mapId, fetchMap]);

  // Auto-save when nodes or edges change
  useEffect(() => {
    if (mapId && nodes.length > 0) {
      saveNodes(mapId, nodes);
    }
  }, [mapId, nodes, saveNodes]);

  useEffect(() => {
    if (mapId) {
      saveEdges(mapId, edges);
    }
  }, [mapId, edges, saveEdges]);

  return {
    map,
    maps,
    nodes,
    edges,
    isLoading,
    isSaving,
    fetchMaps,
    fetchMap,
    createMap,
    deleteMap,
    updateMapTitle,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNodeContent,
    updateNodeColor,
    deleteSelectedNodes,
    setNodes,
    setEdges,
  };
};
