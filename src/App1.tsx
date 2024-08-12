// File: src/App.tsx
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

// Types
interface NodeInput {
  id: string;
  type: string;
  label: string;
}

interface NodeOutput {
  id: string;
  type: string;
  label: string;
}

interface NodeDefinition {
  id: string;
  type: string;
  label: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  position: { x: number; y: number };
}

interface Connection {
  id: string;
  sourceNodeId: string;
  sourceOutputId: string;
  targetNodeId: string;
  targetInputId: string;
}

interface Workflow {
  nodes: NodeDefinition[];
  connections: Connection[];
}

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);

// App component
const App: React.FC = () => {
  const [workflow, setWorkflow] = useState<Workflow>({ nodes: [], connections: [] });
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [draggingConnection, setDraggingConnection] = useState<{ nodeId: string; outputId: string } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Node templates
  const nodeTemplates: NodeDefinition[] = [
    {
      id: 'input',
      type: 'input',
      label: 'Input',
      inputs: [],
      outputs: [{ id: 'output1', type: 'any', label: 'Output' }],
      position: { x: 0, y: 0 },
    },
    {
      id: 'output',
      type: 'output',
      label: 'Output',
      inputs: [{ id: 'input1', type: 'any', label: 'Input' }],
      outputs: [],
      position: { x: 0, y: 0 },
    },
    {
      id: 'process',
      type: 'process',
      label: 'Process',
      inputs: [{ id: 'input1', type: 'any', label: 'Input 1' }],
      outputs: [{ id: 'output1', type: 'any', label: 'Output 1' }],
      position: { x: 0, y: 0 },
    },
  ];

  // Event handlers
  const handleAddNode = (template: NodeDefinition) => {
    const newNode: NodeDefinition = {
      ...template,
      id: generateId(),
      position: { x: 100, y: 100 },
    };
    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
  };

  const handleNodeMouseDown = (nodeId: string) => (e: React.MouseEvent) => {
    setDraggingNode(nodeId);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });

      if (draggingNode) {
        setWorkflow(prev => ({
          ...prev,
          nodes: prev.nodes.map(node =>
            node.id === draggingNode ? { ...node, position: { x, y } } : node
          ),
        }));
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingNode(null);
    setDraggingConnection(null);
  };

  const handleOutputMouseDown = (nodeId: string, outputId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingConnection({ nodeId, outputId });
  };

  const handleInputMouseUp = (nodeId: string, inputId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (draggingConnection && draggingConnection.nodeId !== nodeId) {
      setWorkflow(prev => ({
        ...prev,
        connections: [
          ...prev.connections,
          {
            id: generateId(),
            sourceNodeId: draggingConnection.nodeId,
            sourceOutputId: draggingConnection.outputId,
            targetNodeId: nodeId,
            targetInputId: inputId,
          },
        ],
      }));
    }
    setDraggingConnection(null);
  };

  const handleNodeDoubleClick = (nodeId: string) => () => {
    setEditingNode(nodeId);
  };

  const handleUpdateNode = (updatedNode: NodeDefinition) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => (node.id === updatedNode.id ? updatedNode : node)),
    }));
    setEditingNode(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    setWorkflow(prev => ({
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(
        conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
      ),
    }));
  };

  const handleDeleteConnection = (connectionId: string) => {
    setWorkflow(prev => ({
      ...prev,
      connections: prev.connections.filter(conn => conn.id !== connectionId),
    }));
  };

  // Render functions
  const renderNode = (node: NodeDefinition) => (
    <div
      key={node.id}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        backgroundColor: 'white',
        border: '1px solid black',
        borderRadius: '5px',
        padding: '10px',
        cursor: 'move',
      }}
      onMouseDown={handleNodeMouseDown(node.id)}
      onDoubleClick={handleNodeDoubleClick(node.id)}
    >
      <div>{node.label}</div>
      <div>
        Inputs:
        {node.inputs.map(input => (
          <div
            key={input.id}
            style={{
              display: 'inline-block',
              margin: '2px',
              padding: '2px',
              backgroundColor: 'lightblue',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
            onMouseUp={handleInputMouseUp(node.id, input.id)}
          >
            {input.label}
          </div>
        ))}
      </div>
      <div>
        Outputs:
        {node.outputs.map(output => (
          <div
            key={output.id}
            style={{
              display: 'inline-block',
              margin: '2px',
              padding: '2px',
              backgroundColor: 'lightgreen',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
            onMouseDown={handleOutputMouseDown(node.id, output.id)}
          >
            {output.label}
          </div>
        ))}
      </div>
      <button onClick={() => handleDeleteNode(node.id)}>Delete</button>
    </div>
  );

  const renderConnection = (connection: Connection) => {
    const sourceNode = workflow.nodes.find(node => node.id === connection.sourceNodeId);
    const targetNode = workflow.nodes.find(node => node.id === connection.targetNodeId);

    if (!sourceNode || !targetNode) return null;

    const startX = sourceNode.position.x + 100; // Adjust based on node size
    const startY = sourceNode.position.y + 30;
    const endX = targetNode.position.x;
    const endY = targetNode.position.y + 30;

    return (
      <svg
        key={connection.id}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="black"
          strokeWidth="2"
        />
        <circle
          cx={(startX + endX) / 2}
          cy={(startY + endY) / 2}
          r="5"
          fill="red"
          style={{ cursor: 'pointer', pointerEvents: 'all' }}
          onClick={() => handleDeleteConnection(connection.id)}
        />
      </svg>
    );
  };

  const renderDraggingConnection = () => {
    if (!draggingConnection) return null;

    const sourceNode = workflow.nodes.find(node => node.id === draggingConnection.nodeId);
    if (!sourceNode) return null;

    const startX = sourceNode.position.x + 100; // Adjust based on node size
    const startY = sourceNode.position.y + 30;

    return (
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <line
          x1={startX}
          y1={startY}
          x2={mousePosition.x}
          y2={mousePosition.y}
          stroke="black"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      </svg>
    );
  };

  const renderNodeEditor = () => {
    if (!editingNode) return null;

    const node = workflow.nodes.find(n => n.id === editingNode);
    if (!node) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          border: '1px solid black',
          borderRadius: '5px',
          zIndex: 1000,
        }}
      >
        <h3>Edit Node</h3>
        <input
          type="text"
          value={node.label}
          onChange={e => handleUpdateNode({ ...node, label: e.target.value })}
        />
        <h4>Inputs</h4>
        {node.inputs.map((input, index) => (
          <div key={input.id}>
            <input
              type="text"
              value={input.label}
              onChange={e => {
                const newInputs = [...node.inputs];
                newInputs[index] = { ...input, label: e.target.value };
                handleUpdateNode({ ...node, inputs: newInputs });
              }}
            />
            <button onClick={() => {
              const newInputs = node.inputs.filter(i => i.id !== input.id);
              handleUpdateNode({ ...node, inputs: newInputs });
            }}>Remove</button>
          </div>
        ))}
        <button onClick={() => {
          const newInputs = [...node.inputs, { id: generateId(), type: 'any', label: 'New Input' }];
          handleUpdateNode({ ...node, inputs: newInputs });
        }}>Add Input</button>
        <h4>Outputs</h4>
        {node.outputs.map((output, index) => (
          <div key={output.id}>
            <input
              type="text"
              value={output.label}
              onChange={e => {
                const newOutputs = [...node.outputs];
                newOutputs[index] = { ...output, label: e.target.value };
                handleUpdateNode({ ...node, outputs: newOutputs });
              }}
            />
            <button onClick={() => {
              const newOutputs = node.outputs.filter(o => o.id !== output.id);
              handleUpdateNode({ ...node, outputs: newOutputs });
            }}>Remove</button>
          </div>
        ))}
        <button onClick={() => {
          const newOutputs = [...node.outputs, { id: generateId(), type: 'any', label: 'New Output' }];
          handleUpdateNode({ ...node, outputs: newOutputs });
        }}>Add Output</button>
        <button onClick={() => setEditingNode(null)}>Close</button>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '200px', borderRight: '1px solid black', padding: '10px' }}>
        <h3>Node Templates</h3>
        {nodeTemplates.map(template => (
          <button key={template.id} onClick={() => handleAddNode(template)}>
            Add {template.label}
          </button>
        ))}
      </div>
      <div
        ref={canvasRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        {workflow.nodes.map(renderNode)}
        {workflow.connections.map(renderConnection)}
        {renderDraggingConnection()}
      </div>
      {renderNodeEditor()}
    </div>
  );
};

export default App;