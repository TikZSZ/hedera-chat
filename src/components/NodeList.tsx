// File: src/components/NodeList.tsx
import React from 'react';
import { NodeDefinition } from '../types';

const predefinedNodes: NodeDefinition[] = [
  {
    id: '1',
    type: 'input',
    label: 'Input',
    inputs: [],
    outputs: [{ id: 'output', type: 'string', label: 'Output' }],
    process: async () => 'Input value'
  },
  {
    id: '2',
    type: 'input',
    label: 'Dog Image Input',
    inputs: [],
    outputs: [{ id: 'input', type: 'string', label: 'Dog Image' }],
    process: async () => 'Input value'
  },
  {
    id: 'dog',
    type: 'dog',
    label: 'Dog Breed Clasifier',
    inputs: [{ id: 'input', type: 'string', label: 'Dog Image' }],
    outputs: [{ id: 'dog', type: 'string', label: 'Dog Breed' }],
    process: async () => 'Input value'
  },
  {
    id: 'output',
    type: 'output',
    label: 'Output',
    inputs: [{ id: 'input', type: 'string', label: 'Input' }],
    outputs: [],
    process: async (inputs: { input: string }) => console.log(inputs.input)
  },
  // Add more predefined nodes as needed
];

interface NodeListProps {
  onNodeSelect: (node: NodeDefinition) => void;
}

const NodeList: React.FC<NodeListProps> = ({ onNodeSelect }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Available Nodes</h2>
      <ul>
        {predefinedNodes.map(node => (
          <li
            key={node.id} 
            className="cursor-pointer bg-gray-100 p-2 mb-2 rounded hover:bg-gray-200"
            onClick={() => onNodeSelect({ ...node, id: `${node.type}-${Date.now()}` })}
          >
            {node.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NodeList;