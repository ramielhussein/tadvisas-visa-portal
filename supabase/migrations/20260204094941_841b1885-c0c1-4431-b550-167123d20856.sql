-- Mind Maps table
CREATE TABLE public.mind_maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Mind Map',
  description TEXT,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mind Map Nodes table
CREATE TABLE public.mind_map_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.mind_maps(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL, -- React Flow node ID
  position_x NUMERIC NOT NULL DEFAULT 0,
  position_y NUMERIC NOT NULL DEFAULT 0,
  content TEXT NOT NULL DEFAULT '',
  color TEXT DEFAULT '#3b82f6',
  node_type TEXT DEFAULT 'default',
  width NUMERIC,
  height NUMERIC,
  parent_node_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(map_id, node_id)
);

-- Mind Map Edges table
CREATE TABLE public.mind_map_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.mind_maps(id) ON DELETE CASCADE,
  edge_id TEXT NOT NULL, -- React Flow edge ID
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  label TEXT,
  edge_type TEXT DEFAULT 'smoothstep',
  animated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(map_id, edge_id)
);

-- Mind Map Collaborators (for sharing)
CREATE TABLE public.mind_map_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.mind_maps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'view', -- 'view' or 'edit'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(map_id, user_id)
);

-- Enable RLS
ALTER TABLE public.mind_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_map_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_map_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mind_maps
CREATE POLICY "Users can view their own maps" ON public.mind_maps
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view shared maps" ON public.mind_maps
  FOR SELECT USING (
    is_shared = true OR
    EXISTS (
      SELECT 1 FROM public.mind_map_collaborators
      WHERE map_id = mind_maps.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own maps" ON public.mind_maps
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own maps" ON public.mind_maps
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Collaborators can update shared maps" ON public.mind_maps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.mind_map_collaborators
      WHERE map_id = mind_maps.id AND user_id = auth.uid() AND permission = 'edit'
    )
  );

CREATE POLICY "Users can delete their own maps" ON public.mind_maps
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for mind_map_nodes
CREATE POLICY "Users can view nodes of their maps" ON public.mind_map_nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mind_maps
      WHERE id = mind_map_nodes.map_id AND (
        owner_id = auth.uid() OR
        is_shared = true OR
        EXISTS (
          SELECT 1 FROM public.mind_map_collaborators
          WHERE map_id = mind_maps.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage nodes of their maps" ON public.mind_map_nodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mind_maps
      WHERE id = mind_map_nodes.map_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.mind_map_collaborators
          WHERE map_id = mind_maps.id AND user_id = auth.uid() AND permission = 'edit'
        )
      )
    )
  );

-- RLS Policies for mind_map_edges
CREATE POLICY "Users can view edges of their maps" ON public.mind_map_edges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mind_maps
      WHERE id = mind_map_edges.map_id AND (
        owner_id = auth.uid() OR
        is_shared = true OR
        EXISTS (
          SELECT 1 FROM public.mind_map_collaborators
          WHERE map_id = mind_maps.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage edges of their maps" ON public.mind_map_edges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mind_maps
      WHERE id = mind_map_edges.map_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.mind_map_collaborators
          WHERE map_id = mind_maps.id AND user_id = auth.uid() AND permission = 'edit'
        )
      )
    )
  );

-- RLS Policies for collaborators
CREATE POLICY "Map owners can manage collaborators" ON public.mind_map_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mind_maps
      WHERE id = mind_map_collaborators.map_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their collaborations" ON public.mind_map_collaborators
  FOR SELECT USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_mind_maps_updated_at
  BEFORE UPDATE ON public.mind_maps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mind_map_nodes_updated_at
  BEFORE UPDATE ON public.mind_map_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.mind_map_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mind_map_edges;