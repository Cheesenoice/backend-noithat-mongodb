// let count = 0
// function create_tree(arr, parentId = ""){
//         const tree = [];
//         arr.forEach(item => {
//             if(item.parent_id === parentId){
//                 count++;
//                 const newItem = item;
//                 newItem.index = count; // giúp chỉnh sửa lại vị trí trong danh mục
//                 const children = create_tree(arr, item.id);
//                 if (children.length > 0){
//                     newItem.children = children;
//                 }
//                 tree.push(newItem)
//             }
            
//         });
//         return tree;
//     }
// module.exports.tree = (arr, parentId = "")=>{
//     count = 0;
//     const tree = create_tree(arr, parentId = "");
//     return tree;
// }

function createTree(arr, parentId = "") {
    let index = 0;

    const buildTree = (items, parent) => {
        const tree = [];
        items.forEach(item => {
            if (item.parent_id === parent) {
                index++;
                const newItem = {
                    id: item.id,
                    name: item.title,       // Hoặc item.name tùy theo DB
                    slug: item.slug || '',  // Hoặc tạo slug từ title
                    parent_id: item.parent_id,
                    index: index,
                    children: []
                };

                // Đệ quy tìm con
                const children = buildTree(items, item.id);
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
