// File: src/components/Canvas.tsx
import React, { useState } from 'react';
import { Workflow, NodeDefinition, Connection } from '../types';

interface CanvasProps {
  workflow: Workflow;
  onNodeSelect: (node: NodeDefinition) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onConnectionUpdate: (connection: Connection) => void;
}

const Canvas: React.FC<CanvasProps> = ({ workflow, onNodeSelect, onNodeMove, onConnectionUpdate }) => {
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; outputId: string } | null>(null);

  const handleMouseDown = (nodeId: string) => (e: React.MouseEvent) => {
    setDraggedNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode) {
      const canvas = e.currentTarget.getBoundingClientRect();
      onNodeMove(draggedNode, {
        x: e.clientX - canvas.left,
        y: e.clientY - canvas.top,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleOutputClick = (nodeId: string, outputId: string) => {
    setConnectionStart({ nodeId, outputId });
  };

  const handleInputClick = (nodeId: string, inputId: string) => {
    if (connectionStart) {
      onConnectionUpdate({
        sourceNodeId: connectionStart.nodeId,
        sourceOutputId: connectionStart.outputId,
        targetNodeId: nodeId,
        targetInputId: inputId,
      });
      setConnectionStart(null);
    }
  };

  return (
    <div 
      className="w-full h-full bg-gray-50 relative" 
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {workflow.nodes.map(node => (
        <div
          key={node.id}
          className="absolute bg-white border border-gray-300 p-2 rounded shadow"
          style={{ left: node.position?.x, top: node.position?.y }}
          onMouseDown={handleMouseDown(node.id)}
        >
          <h3>{node.label}</h3>
          <div>
            Inputs:
            {node.inputs.map(input => (
              <div 
                key={input.id}
                className="bg-blue-200 p-1 m-1 rounded cursor-pointer"
                onClick={() => handleInputClick(node.id, input.id)}
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
                className="bg-green-200 p-1 m-1 rounded cursor-pointer"
                onClick={() => handleOutputClick(node.id, output.id)}
              >
                {output.label}
              </div>
            ))}
          </div>
        </div>
      ))}
      {workflow.connections.map((connection, index) => (
        <svg key={index} className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <line
            x1={workflow.nodes.find(n => n.id === connection.sourceNodeId)?.position?.x || 0}
            y1={workflow.nodes.find(n => n.id === connection.sourceNodeId)?.position?.y || 0}
            x2={workflow.nodes.find(n => n.id === connection.targetNodeId)?.position?.x || 0}
            y2={workflow.nodes.find(n => n.id === connection.targetNodeId)?.position?.y || 0}
            stroke="black"
          />
        </svg>
      ))}
    </div>
  );
};

export default Canvas;