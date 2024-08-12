// File: src/App.tsx
import React, { useState } from 'react';
import { NodeDefinition, Connection, Workflow } from './types';
import NodeList from './components/NodeList';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [workflow, setWorkflow] = useState<Workflow>({
    id: '1',
    name: 'New Workflow',
    nodes: [],
    connections: [],
  });

  const [selectedNode, setSelectedNode] = useState<NodeDefinition | null>(null);

  const addNode = (node: NodeDefinition) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, { ...node, position: { x: 100, y: 100 } }],
    }))
  }

  const updateNodePosition = (nodeId: string, position: { x: number, y: number }) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, position } : node
      ),
    }));
  };

  const updateConnection = (connection: Connection) => {
    setWorkflow(prev => ({
      ...prev,
      connections: [...prev.connections, connection],
    }));
  };

  return (
    <div className="flex h-screen">
      <Sidebar>
        <NodeList onNodeSelect={addNode} />
      </Sidebar>
      <main className="flex-grow">
        <Canvas
          workflow={workflow}
          onNodeSelect={setSelectedNode}
          onNodeMove={updateNodePosition}
          onConnectionUpdate={updateConnection}
        />
      </main>
      <Sidebar>
        {selectedNode && (
          <div>
            {JSON.stringify(selectedNode.position)}
            <h2>{selectedNode.label}</h2>
            {/* Display node properties and allow editing */}
          </div>
        )}
      </Sidebar>
    </div>
  );
};

export default App;