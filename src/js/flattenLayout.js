export default function flattenLayout(layout) {
    var keys = Object.keys(layout);
    return keys.reduce(function(acc,curr) {
        var item = layout[curr];
        
        acc.push(item);
        if(!item.collapsed && item.enabled && item.type !="ADD") {
            const value = item.value;
            if(value.category === "INPUT") {
                acc.push(value);
            }
            else {
                acc = acc.concat(flattenLayout(item.value));
            }
        }
        return acc;
    },[]);
    
}