// File: src/types.ts
export interface NodeInput {
  id: string;
  type: string;
  label: string;
}

export interface NodeOutput {
  id: string;
  type: string;
  label: string;
}

export interface NodeDefinition {
  id: string;
  type: string;
  label: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  process: (inputs: any) => Promise<any>;
  position?: { x: number; y: number };
}

export interface Connection {
  sourceNodeId: string;
  sourceOutputId: string;
  targetNodeId: string;
  targetInputId: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: NodeDefinition[];
  connections: Connection[];
}