export default function layoutToOutput(layout) {
    var keys = Object.keys(layout);

    if(layout.category === "INPUT") {
        switch (layout.type) {
        case "Boolean":
            return layout.value === "true";
        case "Integer":
            return parseInt(layout.value);
        default:
            return layout.value;
        }
    }
    else {
        return keys.reduce((acc,curr) => {
            var item = layout[curr];
            if(item.enabled) {
                if(item.value.category === "INPUT") {
                    switch (item.value.type) {
                    case "Boolean":
                        acc[curr] = item.value.value === "true";
                        break;
                    case "Integer":
                        acc[curr] = parseInt(item.value.value);
                        break;
                    default:
                        acc[curr] = item.value.value;
                        break;
                    }
                }
                else if(typeof item.value === "object" && !item.array)
                    acc[curr] = layoutToOutput(item.value);
                else if (typeof item.value === "object" && item.array) { //&& ["Integer","Boolean","String"].indexOf(item.type)<0
                    acc[curr] = item.value
                        .filter(d=>d.type != "ADD")
                        .filter(d=>d.enabled)
                        .map(m=>layoutToOutput(m.value));
                }
                else {
                    acc[curr] = item.value;
                }
            }
            return acc;
        },{});
    }
}