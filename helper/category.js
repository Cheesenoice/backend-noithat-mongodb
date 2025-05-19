function createTree(arr, parentId = "") {
  let index = 0;

  const buildTree = (items, parent) => {
    const tree = [];
    items.forEach((item) => {
      const itemParent = item.parent_id ? item.parent_id.toString() : "";
      const currentParent = parent ? parent.toString() : "";

      if (itemParent === currentParent) {
        index++;

        const newItem = {
          id: item._id,
          name: item.title,
          thumbnail: item.thumbnail,
          slug: item.slug || '',
          parent_id: item.parent_id,
          index: index,
          accountFullName: item.accountFullName || "Unknown",
          lastUpdater: item.lastUpdater || {
            name: "Not updated yet",
            time: item.createdAt
          },
          status: item.status, // <-- Add this line
          children: []
        };

        // Đệ quy lấy con
        const children = buildTree(items, item._id);
        if (children.length > 0) {
          newItem.children = children;
        }

        tree.push(newItem);
      }
    });
    return tree;
  };

  return buildTree(arr, parentId);
}

module.exports.tree = (arr, parentId = "") => {
  return createTree(arr, parentId);
};
