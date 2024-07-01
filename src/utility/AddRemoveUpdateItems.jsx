import { TASK, TASK_GROUP } from "../Constants";

// Helper function to find the target group and add the item.
const addItem = (item, targetId, node) => {
  if (node.id === targetId) {
    if (!node.children) node.children = [];
    node.children.push(item);
    // Sorting & reversing so that sub-tasks appear above sub-groups.
    node.children.sort(tasksFirstGroupsNext);
  } else if (node.children) {
    // Find and add the item in the group in which it needs to be added.
    node.children.forEach((child) => addItem(item, targetId, child));
  }
};

// Helper function to find and remove the item from its original location.
const removeItem = (id, node) => {
  if (node.children) {
    node.children = node.children.filter((child) => {
      // if the item to be removed is a TaskGroup, then remove its children too.
      if (child.id === id && child.type === TASK_GROUP) {
        child.children = [];
      }

      return child.id !== id;
    });
    node.children.sort(tasksFirstGroupsNext);
    // If item not found in node.children, search and remove it from each child of node.children.
    node.children.forEach((child) => removeItem(id, child));
  }
};

function tasksFirstGroupsNext(child1, child2) {
  if (child1.type === TASK && child2.type === TASK_GROUP) {
    return -1;
  } else if (child1.type === TASK_GROUP && child2.type === TASK) {
    return 1;
  } else {
    return 0;
  }
}

const updateItem = (id, name, node) => {
  if (node.id === id) {
    console.log("previous name: " + node.name);
    node.name = name;
    console.log("updated name: " + node.name);
  } else if (node.children) {
    node.children.forEach((child) => updateItem(id, name, child));
  }
};

export { addItem, removeItem, updateItem };
