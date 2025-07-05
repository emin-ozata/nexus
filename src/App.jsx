import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './App.css';

import { Editor } from '@monaco-editor/react';

const CustomNode = React.memo(({ data }) => {
  return (
    <div className={`custom-node ${data.type}`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#58a6ff', opacity: data.type !== 'root' ? 1 : 0 }}
        isConnectable={data.type !== 'root'}
      />
      <div className="node-header">
        <span className="node-title">{data.title}</span>
        {data.badge && <span className="node-badge">{data.badge}</span>}
      </div>
      {data.fields?.length > 0 && (
        <div className="node-content">
          {data.fields.map((field) => (
            <div key={field.handleId} className="node-field">
              <span className="field-key">{field.key}:</span>
              <span className={`field-value ${field.type}`}>{field.value}</span>
              {field.connectable && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={field.handleId}
                  style={{
                    background: '#58a6ff',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const initialJson = {
  "companies": [
    {
      "companyId": "ACME001",
      "companyName": "Acme Corporation",
      "slogan": "We make everything!",
      "industry": "Diversified Manufacturing",
      "departments": [
        {
          "deptId": "DPMFG",
          "name": "Manufacturing Division",
          "head": "Wile E. Coyote",
          "employees": [
            {
              "employeeId": "EMP001",
              "firstName": "Bugs",
              "lastName": "Bunny",
              "role": "Product Tester",
              "hireDate": "1940-07-27T00:00:00Z"
            }
          ]
        },
        {
          "deptId": "DPRND",
          "name": "Research & Development",
          "head": "Marvin Martian",
          "employees": [
            {
              "employeeId": "EMP003",
              "firstName": "Elmer",
              "lastName": "Fudd",
              "role": "Invention Specialist",
              "hireDate": "1940-07-27T00:00:00Z"
            }
          ]
        }
      ],
      "established": "1930-01-01T00:00:00Z"
    }
  ],
  "dataExportTimestamp": "2025-07-04T20:21:20Z"
}

export default function App() {
  const [jsonInput, setJsonInput] = useState(JSON.stringify(initialJson, null, 2));
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState('');
  const debouncedJsonInput = useDebounce(jsonInput, 500);
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  const parseJsonToFlow = useCallback(() => {
    try {
      if (debouncedJsonInput.trim() === '') {
        setError('');
        setNodes([]);
        setEdges([]);
        return;
      }

      const parsedJson = JSON.parse(debouncedJsonInput);
      const newNodes = [];
      const newEdges = [];
      let idCounter = 0;
      const startX = 0,
        startY = -250,
        spacingX = 350,
        spacingY = 50;

      const formatValue = (v) => {
        if (Array.isArray(v)) return `Array[${v.length}]`;
        if (typeof v === 'object' && v !== null) return `Object[${Object.keys(v).length}]`;
        if (typeof v === 'string') return `${v.length > 20 ? v.substring(0, 20) + '...' : v}`;
        return String(v);
      };

      const getFieldType = (v) => {
        if (Array.isArray(v)) return 'array';
        if (typeof v === 'object' && v !== null) return 'object';
        return typeof v;
      };

      const calculateNodeHeight = (fields) => 50 + (fields.length > 0 ? 20 : 0) + fields.length * 30;

      let rootNodeId = null;

      function traverse(value, parentId, sourceHandle, depth, nodeTitle, x, y) {
        const isArray = Array.isArray(value);
        const isObject = typeof value === 'object' && value !== null;

        if (isArray) {
          let yOffset = 0;
          value.forEach((item, index) => {
            const childId = `${idCounter++}`;
            const itemType = getFieldType(item);
            const isItemObject = typeof item === 'object' && item !== null;

            if (isItemObject) {
              const itemFields = Object.entries(item).map(([key, val]) => ({
                key,
                handleId: `${childId}-key-${key}`,
                value: formatValue(val),
                type: getFieldType(val),
                connectable: typeof val === 'object' && val !== null,
              }));

              const nodeHeight = calculateNodeHeight(itemFields);

              newNodes.push({
                id: childId,
                type: 'custom',
                position: { x, y: y + yOffset },
                data: {
                  title: `${nodeTitle}[${index}]`,
                  type: itemType,
                  fields: itemFields,
                  badge: `${itemFields.length} keys`,
                },
              });

              newEdges.push({
                id: `edge-${parentId}-${sourceHandle}-${childId}`,
                source: parentId,
                target: childId,
                sourceHandle,
                type: 'smoothstep',
                style: { stroke: '#8b949e' },
              });

              let maxYOffset = y + yOffset;
              itemFields.forEach((f) => {
                if (f.connectable) {
                  const subtreeHeight = traverse(
                    item[f.key],
                    childId,
                    f.handleId,
                    depth + 1,
                    f.key,
                    x + spacingX,
                    maxYOffset
                  );
                  maxYOffset += subtreeHeight + spacingY;
                }
              });

              yOffset += nodeHeight + spacingY;
            } else {
              // Primitive item için node oluştur
              const valStr = formatValue(item);

              newNodes.push({
                id: childId,
                type: 'custom',
                position: { x, y: y + yOffset },
                data: {
                  title: `${nodeTitle}[${index}]`,
                  type: itemType,
                  fields: [
                    {
                      key: 'value',
                      handleId: `${childId}-key-value`,
                      value: valStr,
                      type: itemType,
                      connectable: false,
                    },
                  ],
                  badge: '',
                },
              });

              newEdges.push({
                id: `edge-${parentId}-${sourceHandle}-${childId}`,
                source: parentId,
                target: childId,
                sourceHandle,
                type: 'smoothstep',
                style: { stroke: '#8b949e' },
              });

              yOffset += 80 + spacingY; // primitive node yüksekliği sabit alındı
            }
          });
          return yOffset - spacingY;
        }


        const id = `${idCounter++}`;
        const fields = [];
        const children = [];

        if (isObject) {
          Object.entries(value).forEach(([key, val]) => {
            const itemType = getFieldType(val);
            const handleId = `${id}-key-${key}`;
            const isValObject = typeof val === 'object' && val !== null;

            fields.push({
              key,
              handleId,
              value: formatValue(val),
              type: itemType,
              connectable: isValObject,
            });

            if (isValObject) {
              children.push({
                handleId,
                value: val,
                title: key,
              });
            }
          });
        }

        const nodeHeight = calculateNodeHeight(fields);
        newNodes.push({
          id,
          type: 'custom',
          position: { x, y },
          data: {
            title: nodeTitle,
            type: depth === 0 ? 'root' : isObject ? 'object' : 'primitive',
            fields,
            badge: isObject ? `${Object.keys(value).length} keys` : '',
          },
        });

        if (depth === 0) {
          rootNodeId = id;
        }

        if (parentId) {
          newEdges.push({
            id: `edge-${parentId}-${sourceHandle}-${id}`,
            source: parentId,
            target: id,
            sourceHandle,
            type: 'smoothstep',
            style: { stroke: '#8b949e' },
          });
        }

        let yOffset = 0;
        children.forEach((child) => {
          const childHeight = traverse(
            child.value,
            id,
            child.handleId,
            depth + 1,
            child.title,
            x + spacingX,
            y + yOffset
          );
          yOffset += Math.max(childHeight, 60) + spacingY;
        });


        return Math.max(nodeHeight, yOffset > 0 ? yOffset - spacingY : 0);
      }

      const totalHeight = traverse(parsedJson, null, null, 0, 'Root', startX, startY);

      const viewportHeight = window.innerHeight || 600;
      const centerY = (viewportHeight - totalHeight) / 2;

      newNodes.forEach((node) => {
        if (node.id === rootNodeId) {
          node.position.y = centerY;
        } else {
          node.position.y += centerY;
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);
      setError('');
    } catch (e) {
      setError('Invalid JSON format. Please check your input.');
    }
  }, [debouncedJsonInput, setNodes, setEdges]);

  useEffect(() => {
    parseJsonToFlow();
  }, [parseJsonToFlow]);

  return (
    <div className="app-container">
      <div className="panel json-panel">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={jsonInput}
          onChange={(val) => setJsonInput(val || '')}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            folding: true,
            lineNumbers: 'on',
            renderWhitespace: 'none',
          }}
        />
        {error && <div className="error-panel">{error}</div>}
      </div>
      <div className="panel flow-panel">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1, minZoom: 0.5, maxZoom: 1.5 }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls />
          <Background variant="dots" gap={16} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
