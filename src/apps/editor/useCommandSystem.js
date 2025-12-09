import { useCallback } from 'react';
import { commandSystem, CreateObjectCommand, DeleteObjectCommand, TransformCommand, PropertyChangeCommand } from './CommandSystem';

export const useCommandSystem = (updateState) => {
  const executeCommand = useCallback((command) => {
    commandSystem.execute(command);
    if (updateState) updateState();
  }, [updateState]);

  const undo = useCallback(() => {
    const result = commandSystem.undo();
    if (updateState && result) updateState();
    return result;
  }, [updateState]);

  const redo = useCallback(() => {
    const result = commandSystem.redo();
    if (updateState && result) updateState();
    return result;
  }, [updateState]);

  const createObject = useCallback((objectData, onAdd, onRemove) => {
    const command = new CreateObjectCommand(objectData, onAdd, onRemove);
    executeCommand(command);
  }, [executeCommand]);

  const deleteObject = useCallback((objectData, onAdd, onRemove) => {
    const command = new DeleteObjectCommand(objectData, onAdd, onRemove);
    executeCommand(command);
  }, [executeCommand]);

  const transformObject = useCallback((objectId, oldTransform, newTransform, onTransform) => {
    const command = new TransformCommand(objectId, oldTransform, newTransform, onTransform);
    executeCommand(command);
  }, [executeCommand]);

  const changeProperty = useCallback((objectId, property, oldValue, newValue, onPropertyChange) => {
    const command = new PropertyChangeCommand(objectId, property, oldValue, newValue, onPropertyChange);
    executeCommand(command);
  }, [executeCommand]);

  return {
    executeCommand,
    undo,
    redo,
    createObject,
    deleteObject,
    transformObject,
    changeProperty,
    getState: () => commandSystem.getState(),
    canUndo: () => commandSystem.canUndo(),
    canRedo: () => commandSystem.canRedo()
  };
};
