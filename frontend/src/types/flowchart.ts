export interface FlowNode {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  timeline: string;
  description: string;
  action: string;
  status: 'mandatory' | 'statutory' | 'audit' | 'final';
}

export interface FlowchartDefinition {
  id: 'product' | 'hallmarking';
  title: string;
  description: string;
  nodes: FlowNode[];
}
