import QixProperty from "./qixProperty";

function getValue(struct, propAccessor) {
    const accessors = propAccessor.split("/");
    return accessors
        .reduce(function(acc,curr) {
            return acc[curr];
        },struct);
}

export default (state,action) => {
    switch (action.type) {
    case "NEW_STRUCTURE":
        return new QixProperty(action.struct);
    case "UPDATE_PROP":
        return updateProp(state,action);
    case "ADD_PROP":
        return addProp(state,action);
    default:
      return state;
  }
}

function updateProp(state,action) {
    const accessor = action.accessor.slice(action.accessor.indexOf("/")+1);
    const value = getValue(state,accessor);
    value[action.prop] = action.newVal;
    return state;
}

function addProp(state,action) {
    const accessor = action.accessor.slice(action.accessor.indexOf("/")+1);
    let accessors = accessor.split("/");
    let currStruct = state;
    while (accessors.length > 1) {
        currStruct = currStruct[accessors.shift()];
    }
    currStruct.value = currStruct.value.slice(0,-1)
        .concat(new QixProperty(action.propType, {
            depth: currStruct.depth + 1,
            accessor: currStruct.accessor + "/value/" + (currStruct.value.length-1),
            name: currStruct.value.length-1
        }))
        .concat(currStruct.value.slice(-1));

    console.log(currStruct);
    
    return state;
}