import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import MindMapList from '@/components/mindmap/MindMapList';
import MindMapCanvas from '@/components/mindmap/MindMapCanvas';

const MindMap = () => {
  const { id } = useParams();

  return (
    <Layout>
      <div className="h-[calc(100vh-120px)]">
        {id ? (
          <MindMapCanvas mapId={id} />
        ) : (
          <MindMapList />
        )}
      </div>
    </Layout>
  );
};

export default MindMap;
