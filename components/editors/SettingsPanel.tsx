// components/editor/SettingsPanel.tsx
import React from 'react';
import { useEditor } from '@craftjs/core';

export const SettingsPanel: React.FC = () => {
  const { selected, actions } = useEditor((state, query) => {
    // Get the currently selected node ID
    const currentNodeId = state.events.selected;
    let selected;

    if (currentNodeId) {
      // Handle the case where currentNodeId might be a Set
      // Convert it to string if needed
      const nodeId = currentNodeId instanceof Set 
        ? Array.from(currentNodeId)[0] 
        : currentNodeId as string;
      
      if (nodeId && state.nodes[nodeId]) {
        const node = state.nodes[nodeId];
        
        selected = {
          id: nodeId,
          name: node.data.displayName || node.data.name || nodeId,
          settings: node.related && typeof node.related === 'object' ? node.related.settings : null,
          isDeletable: query.node(nodeId).isDeletable(),
        };
      }
    }

    return {
      selected,
    };
  });

  return selected ? (
    <div className="bg-white border border-gray-200 rounded p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-medium">
          Edit {selected.name}
        </h4>
        {selected.isDeletable && (
          <button
            className="text-red-500 hover:text-red-700 text-sm"
            onClick={() => {
              if (selected.id) {
                actions.delete(selected.id);
              }
            }}
          >
            Delete
          </button>
        )}
      </div>
      
      {selected.settings && React.createElement(selected.settings)}
    </div>
  ) : (
    <div className="bg-gray-100 rounded p-4 text-center">
      <p className="text-sm text-gray-500">
        Select a component to edit its properties
      </p>
    </div>
  );
};

export default SettingsPanel;