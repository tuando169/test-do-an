export const buildObjectTree = (objects) => {
    const objectMap = new Map();
  
    // Create a map of all objects by their ID
    objects.forEach((obj) => {
      objectMap.set(obj.id, { ...obj, children: [] });
    });
  
    // Assign children to their respective parents
    objects.forEach((obj) => {
      if (obj.parent) {
        const parent = objectMap.get(obj.parent);
        if (parent) {
          parent.children.push(objectMap.get(obj.id));
        }
      }
    });
  
    // Return the root objects (those without a parent)
    return Array.from(objectMap.values()).filter((obj) => !obj.parent);
};