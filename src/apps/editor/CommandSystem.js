// Command System for Undo/Redo functionality
class CommandSystem {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistorySize = 50; // Limit history to prevent memory issues
  }

  // Execute a command and add it to history
  execute(command) {
    // Remove any commands after current index (for when we undo then do new action)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Execute the command
    command.execute();
    
    // Add to history
    this.history.push(command);
    this.currentIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  // Undo the last command
  undo() {
    if (this.canUndo()) {
      const command = this.history[this.currentIndex];
      command.undo();
      this.currentIndex--;
      return true;
    }
    return false;
  }

  // Redo the next command
  redo() {
    if (this.canRedo()) {
      this.currentIndex++;
      const command = this.history[this.currentIndex];
      command.execute();
      return true;
    }
    return false;
  }

  // Check if undo is possible
  canUndo() {
    return this.currentIndex >= 0;
  }

  // Check if redo is possible
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  // Clear all history
  clear() {
    this.history = [];
    this.currentIndex = -1;
  }

  // Get current state info
  getState() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historyLength: this.history.length,
      currentIndex: this.currentIndex
    };
  }
}

// Base Command class
class Command {
  execute() {
    throw new Error('Execute method must be implemented');
  }

  undo() {
    throw new Error('Undo method must be implemented');
  }
}

// Command for creating objects (walls, lights, images)
class CreateObjectCommand extends Command {
  constructor(objectData, onAdd, onRemove) {
    super();
    this.objectData = { ...objectData };
    this.onAdd = onAdd;
    this.onRemove = onRemove;
  }

  execute() {
    this.onAdd(this.objectData);
  }

  undo() {
    this.onRemove(this.objectData.id);
  }
}

// Command for deleting objects
class DeleteObjectCommand extends Command {
  constructor(objectData, onAdd, onRemove) {
    super();
    this.objectData = { ...objectData };
    this.onAdd = onAdd;
    this.onRemove = onRemove;
  }

  execute() {
    this.onRemove(this.objectData.id);
  }

  undo() {
    this.onAdd(this.objectData);
  }
}

// Command for transforming objects (move, rotate, scale)
class TransformCommand extends Command {
  constructor(objectId, oldTransform, newTransform, onTransform) {
    super();
    this.objectId = objectId;
    this.oldTransform = { ...oldTransform };
    this.newTransform = { ...newTransform };
    this.onTransform = onTransform;
  }

  execute() {
    this.onTransform(this.objectId, this.newTransform);
  }

  undo() {
    this.onTransform(this.objectId, this.oldTransform);
  }
}

// Command for property changes (color, texture, etc.)
class PropertyChangeCommand extends Command {
  constructor(objectId, property, oldValue, newValue, onPropertyChange) {
    super();
    this.objectId = objectId;
    this.property = property;
    this.oldValue = oldValue;
    this.newValue = newValue;
    this.onPropertyChange = onPropertyChange;
  }

  execute() {
    this.onPropertyChange(this.objectId, this.property, this.newValue);
  }

  undo() {
    this.onPropertyChange(this.objectId, this.property, this.oldValue);
  }
}

// Command for batch operations
class BatchCommand extends Command {
  constructor(commands) {
    super();
    this.commands = commands;
  }

  execute() {
    this.commands.forEach(command => command.execute());
  }

  undo() {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}

// Create singleton instance
const commandSystem = new CommandSystem();

export {
  commandSystem,
  Command,
  CreateObjectCommand,
  DeleteObjectCommand,
  TransformCommand,
  PropertyChangeCommand,
  BatchCommand
};
