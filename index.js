import structsRaw from "raw!./structs.json";
import {curry} from "./src/js/util";
import * as d3 from "d3";
import Rx from "rxjs";
import Clipboard from "clipboard";
import QixProperty from "./src/js/qixProperty";
import "./src/css/style.scss";
import reducer from "./src/js/reducer";
import layoutToOutput from "./src/js/layoutToOutput";
import syntaxHighlight from "./src/js/syntaxHighlight";
import flattenLayout from "./src/js/flattenLayout";
window.d3 = d3;

// Get structures
const structProps = JSON.parse(structsRaw);
const structs = d3.nest()
    .key(d=>d.struct)
    .entries(structProps);

// Create selection mechanism
const select = document.querySelector("#structure");
select.innerHTML = structs
    .map(m=>`<option>${m.key}</option>`)
    .sort()
    .join();

let init = null;

// Check local storage and initialize if necessary
if(localStorage.getItem("qStructure") != null) {
    init = JSON.parse(localStorage.getItem("qStructure"));
    select.value = init.type;
}
else {
    select.value = "HyperCubeDef";
};

const structTable = document.querySelector("#struct-table");

// Hover over table values
const hover$ = Rx.Observable.fromEvent(structTable,"mouseover")
    .map(m=>m.target.__data__)
    .filter(f=>typeof f != "undefined")
    .filter(f=>typeof f.description != "undefined");

const hoverOut$ = Rx.Observable.fromEvent(structTable,"mouseout")
    .startWith(null);

hover$.subscribe(s=>{
    const propDescDiv = document.querySelector("#prop-desc");
    const str = `<div class="prop-title">${s.name}</div>
    <div class="prop-desc-txt">${s.description}</div>
    <div class="prop-type">type: ${s.type}</div>`;
    propDescDiv.innerHTML = str;
    const propDescTile = document.querySelector("#prop-desc-tile");
    propDescTile.classList.remove("inactive");
});

hoverOut$.subscribe(s=> {
    const propDescDiv = document.querySelector("#prop-desc");
    propDescDiv.innerHTML = "Mouse over a property to see a description";
    const propDescTile = document.querySelector("#prop-desc-tile");
    propDescTile.classList.add("inactive");
});



// Actions
const newStructure$ = Rx.Observable.fromEvent(select,"change")
    .map(m=>({
        "type": "NEW_STRUCTURE",
        "struct": m.target.value
    }));



const keyup$ = Rx.Observable.fromEvent(structTable,"keyup");

const changePropAct$ = keyup$
    .map(evt=> ({
        type: "UPDATE_PROP",
        prop: "value",
        newVal: evt.target.value,
        accessor: evt.target.__data__.accessor
    }));

const selectAct$ = Rx.Observable.fromEvent(structTable,"change")
    .map(evt=>({
        type: "UPDATE_PROP",
        prop: "value",
        newVal: evt.target.value,
        accessor: evt.target.__data__.accessor
    }));

const click$ = Rx.Observable.fromEvent(structTable,"click")
    .map(f=>f.target);

const colExpAct$ = click$
    .filter(f=>f.attributes.hasOwnProperty("ui-col-exp"))
    .filter(f=>f.__data__.enabled)
    .map(m => ({
        type: "UPDATE_PROP",
        prop: "collapsed",
        newVal: !m.__data__.collapsed,
        accessor: m.__data__.accessor
    }));

const onOffAct$ = click$
    .filter(f=>f.attributes.hasOwnProperty("ui-on-off"))
    .map(m => ({
        type: "UPDATE_PROP",
        prop: "enabled",
        newVal: !m.__data__.enabled,
        accessor: m.__data__.accessor
    }));

const addPropAct$ = click$
    .filter(f=>f.attributes.hasOwnProperty("ui-add-prop"))
    .map(m => ({
        type: "ADD_PROP",
        propType: m.__data__.dataType,
        accessor: m.__data__.parentAccessor
    }));

const action$ = newStructure$
    .merge(colExpAct$)
    .merge(onOffAct$)
    .merge(changePropAct$)
    .merge(addPropAct$)
    .merge(selectAct$);


// Redux
const struct$ = action$
    .startWith(init === null ? new QixProperty(select.value) : init)
    .scan((s,a) => reducer(s,a))
    .do(l=>localStorage.setItem("qStructure",JSON.stringify(l)))
    .publishReplay(1)
    .refCount();

// JSON Output
const output$ = struct$
    .map(l=>layoutToOutput(l.value))
    .map(l=>JSON.stringify(l,undefined,4))
    .do(d=>window.qixJSON = d)
    .map(l=>syntaxHighlight(l));

output$.subscribe(s=>{
    document.querySelector("#json").innerHTML = s;
});

// Copy to clipboard
const clipboard = new Clipboard('#copy-btn', {
    text: function(trigger) {
        return window.qixJSON;
    }
});

clipboard.on('success', function(e) {
    const btn = document.querySelector("#copy-btn")
    btn.innerHTML = "Copied!";

    setTimeout(function() {
        btn.innerHTML = "Copy to Clipboard";
    },1000);
});

// Render output
const flatStruct$ = struct$
    .map(m=>flattenLayout(m.value));

flatStruct$.subscribe(s=>render(s));

function render(l) {
    //console.log(l);
    const structTable = d3.select("#struct-table");

    // Data join
    const rowUpdate = structTable.selectAll(".row")
        .data(l,d=>d.accessor);
    
    const rowExit = rowUpdate
        .exit()
        .remove();
    
    const rowEnter = rowUpdate
        .enter()
        .append("div");
    
    const row = rowEnter.merge(rowUpdate);

    row
        .attr("class",d=>"row " + (d.enabled ? "enabled " : ""))
        .attr("data-acc",d=>d.accessor)
        .style("padding-left",d=>d.depth*18 + "px");
    
    // PROPERTY ROWS
    const propertyRowEnter = rowEnter.filter(f=>f.category === "PROPERTY");
    
    const propertyRows = row.filter(f=>f.category === "PROPERTY")
        .classed("property",true)
        .attr("ui-col-exp","");
    
    propertyRowEnter.append("img")
        .classed("row-arrow",true)
        .attr("ui-col-exp","");
    
    propertyRows.selectAll(".row-arrow")
        .attr("src",d=>{
            if(d.enabled)
                return d.collapsed ? "./dist/img/tri-collapsed.svg" : "./dist/img/tri-expanded.svg";
            else {
                return "./dist/img/tri-disabled.svg";
            }
        });
    
    propertyRowEnter.append("div")
        .classed("row-prop-name",true)
        .attr("ui-col-exp","")
        .html(d=>d.name);
    
    propertyRowEnter.append("img")
        .classed("row-enablement",true)
        .attr("ui-on-off","");
    
    propertyRows.selectAll(".row-enablement")
        .attr("src",d=>d.enabled ? "./dist/img/checked.svg" : "./dist/img/unchecked.svg");

    propertyRowEnter.append("div")
        .classed("row-type",true)
        .attr("ui-on-off","")
        .html(d=>(d.array ? "array of " : "") + d.type);
    
    // INPUT ROWS
    const inputRowsEnter = rowEnter.filter(f=>f.category === "INPUT");
    const inputRows = row.filter(f=>f.category === "INPUT")
        .classed("input",true);

    inputRowsEnter.filter(f=>f.elemType === "input")
        .append("input")
        .attr("type","text")
        //.style("margin-left",d=>d.depth*18 + "px")
        .attr("value",d=>d.value);
    
    inputRowsEnter.filter(f=>f.elemType === "dropdown")
        .append("select")
        .selectAll("option")
        .data(d=>d.options.map(m=>({val: m, sel: m === d.value})))
        .enter()
        .append("option")
        .attr("selected",d=>d.sel ? "" : null)
        .attr("value",d=>d.val)
        .html(d=>d.val);
    
    // ADD ROWS
    const addRowsEnter = rowEnter.filter(f=>f.category === "ADD");
    const addRows = row.filter(f=>f.category === "ADD")
        .classed("add",true);
    
    addRows
        .classed("enabled",true);

    addRowsEnter.append("div")
        .attr("ui-add-prop","")
        .classed("add",true)
        .html(d=>"+ Add " + d.dataType);

}


/*
const clipboard = new Clipboard('#copy-btn', {
    text: function(trigger) {
        return window.qixJSON;//trigger.getAttribute('aria-label');
    }
});

clipboard.on('success', function(e) {
    // show some feedback with animations
});




const structs = JSON.parse(structsRaw);
const structToBuild = "HyperCubeDef";

const structTable = document.querySelector("#struct-table");

const click$ = Rx.Observable.fromEvent(structTable,"click")
    .map(f=>f.target);

const change$ = Rx.Observable.fromEvent(structTable,"keyup");

const changePropFn$ = change$
    .map(evt=> {
        console.log(evt.target.__data__);
        return updateProperty(undefined,evt.target.value,evt.target.__data__.accessor)
    });

const colExpFn$ = click$
    .filter(f=>f.attributes.hasOwnProperty("ui-col-exp"))
    .filter(f=>f.__data__.enabled)
    .map(m => updateProperty("collapsed",!m.__data__.collapsed,m.__data__.accessor));

const onOffFn$ = click$
    .filter(f=>f.attributes.hasOwnProperty("ui-on-off"))
    .map(m => (l) => {
        l = updateProperty("enabled",!m.__data__.enabled,m.__data__.accessor,l);
        if(m.__data__.enabled) {
            return l;
        }
        else {
            return updateProperty("collapsed",true,m.__data__.accessor,l);
        }
    });

const addPropFn$ = click$
    .filter(f=>f.attributes.hasOwnProperty("ui-add-prop"))
    .map(m => addProperty(structs,m.__data__.accessor));

const action$ = colExpFn$
    .merge(onOffFn$)
    .merge(addPropFn$)
    .merge(changePropFn$);

const struct$ = action$
    .startWith(buildLayout(structToBuild,structs))
    .scan((s,a) => a(s))
    .do(l=>window.l = l)
    .publishReplay(1)
    .refCount();

const flatStruct$ = struct$
    .map(m=>flattenLayout(m));

const output$ = struct$
    .map(l=>layoutToOutput(l))
    .map(l=>JSON.stringify(l,undefined,4))
    .do(d=>window.qixJSON = d)
    .map(l=>syntaxHighlight(l));


flatStruct$.subscribe(s=>render(s));

output$.subscribe(s=>{
    document.querySelector("#json").innerHTML = s;
});


const updateProperty = curry(function(property,value,propAccessor,layout) {
    if(typeof property === "undefined") {
        property = "value";
        //propAccessor = propAccessor.split("/").slice(0,-1).join("/");
    } 
    const prop = getValue(layout,propAccessor);
    console.log(layout,propAccessor);
    prop[property]= value;
    return layout;
});




function buildLayout(structToBuild, structs, accessor) {
    if(typeof accessor === "undefined") {
        accessor = "";
    }
    else {
        accessor += "/value/";
    }
    const depth = accessor.split("/").length;
    return structs
        .filter(function(f) {
            return f.struct === structToBuild
        })
        .reduce(function(acc,curr) {
            var copied = Object.keys(curr)
                .reduce(function(cAcc,cCurr) {
                    cAcc[cCurr] = curr[cCurr];
                    return cAcc;
                },{});
            
            copied.array = JSON.parse(copied.array.toLowerCase());
            copied.collapsed = true;
            copied.depth = depth;
            copied.accessor = accessor + copied.property;
            if(copied.array) {
                copied.value = [{
                    type: "add",
                    depth: depth+1,
                    parentType: copied.type,
                    accessor: copied.accessor + "/add"
                }];
            }
            else if(["Boolean","Integer","String"].indexOf(copied.type) === -1) {
                copied.value = buildLayout(copied.type,structs,copied.accessor);
            }
            else {
                //copied.accessor = copied.accessor + "/value";
                if(typeof copied.default === "undefined") {
                    copied.value = undefined;
                }
                else {
                    switch (copied.type) {
                        case "Integer":
                            copied.value = parseFloat(copied.default);
                            break;
                        case "Boolean":
                            copied.value = copied.default.toLowerCase() === "true";
                            break;
                        case "String":
                            copied.value = copied.default;
                            break;
                    }
                }
            }
            copied.enabled = false;
            acc[copied.property] = copied;
            return acc;
        },{});
}

function layoutToOutput(layout) {
    var keys = Object.keys(layout);

    return keys.reduce((acc,curr) => {
        var item = layout[curr];
        if(item.enabled) {
            if(typeof item.value === "object" && !item.array)
                acc[curr] = layoutToOutput(item.value);
            else if (typeof item.value === "object" && item.array) {
                acc[curr] = item.value
                    .filter(d=>d.type != "add")
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

function render(flatlayout) {
    var structTable = d3.select("#struct-table");
    //structTable.html("");
    var rowUpdate = structTable.selectAll(".row")
        .data(flatlayout,d=>d.accessor);
    
    var rowEnter = rowUpdate
        .enter()
        .append("div");
    
    var row = rowEnter.merge(rowUpdate);

    row
        //.classed("row",true)
        .attr("class",d=>"row " + (d.enabled ? "enabled" : ""))
        .attr("ui-col-exp",d=>d.hasOwnProperty("input") ? null : "")
        .attr("data-acc",d=>d.accessor)
        .style("padding-left",d=>d.depth*18 + "px")
        ;//.html(d=>d.property);
    
    var expandableRow = rowEnter.filter(d=>!d.hasOwnProperty("input") && d.type != "add");
    var inputRow = rowEnter.filter(d=>d.hasOwnProperty("input"));
    var addRow = rowEnter.filter(d=>d.type === "add");
    
    expandableRow.append("img")
        .classed("row-arrow",true)
        .attr("ui-col-exp","")
        .attr("src",d=>{
            if(d.enabled)
                return d.collapsed ? "./dist/img/tri-collapsed.svg" : "./dist/img/tri-expanded.svg";
            else {
                return "./dist/img/tri-disabled.svg";
            }
        });

    expandableRow.append("div")
        .classed("row-prop-name",true)
        .attr("ui-col-exp","")
        .html(d=>d.property);
    
    expandableRow.append("img")
        .classed("row-enablement",true)
        .attr("ui-on-off","")
        .attr("src",d=>d.enabled ? "./dist/img/checked.svg" : "./dist/img/unchecked.svg");

    expandableRow.append("div")
        .classed("row-type",true)
        .attr("ui-on-off","")
        .html(d=>(d.array ? "array of " : "") + d.type);
    
    inputRow
        .classed("input",true);
    
    const inputRowText = inputRow.filter(d=>d.input === "text");
    const inputRowSelect = inputRow.filter(d=>d.input === "dropdown");

    inputRowText
        .append("input")
        .attr("type","text")
        //.style("margin-left",d=>d.depth*18 + "px")
        .attr("value",d=>d.value);
    
    addRow
        .classed("enabled",true);

    addRow.append("div")
        .attr("ui-add-prop","")
        .classed("add",true)
        .html(d=>"+ Add " + d.parentType);

}

function flattenLayout(layout) {
    var keys = Object.keys(layout);
    return keys.reduce(function(acc,curr) {
        var item = layout[curr];
        
        acc.push(item);
        if(!item.collapsed && item.type !="add") {
            const value = item.value;
            if(typeof value != "object") {
                const row = {
                    value: value,
                    accessor: item.accessor,
                    depth: item.depth
                };
                if(item.hasOwnProperty("options")) {
                    row.options = item.options;
                    row.input = "dropdown";
                }
                else {
                    row.input = "text";
                }
                acc.push(row);
            }
            else {
                acc = acc.concat(flattenLayout(item.value));
            }
        }
        return acc;
    },[]);
    
}

const addProperty = curry(function(structs,propAccessor,layout) {
    const prop = getValue(layout,propAccessor);
    const childAccessor = propAccessor + "/value/" + (prop.array ? (prop.value.length-1) : "");
    let value;
    if(["Boolean","Integer","String"].indexOf(prop.type) > -1) {
        value = prop.default;
    }
    else {
        value = buildLayout(prop.type, structs,childAccessor);
    }

    if(prop.array) {
        prop.value = prop.value.slice(0,-1).concat([
            {
                array: false,
                collapsed: true,
                depth: prop.depth + 1,
                description:"",
                enabled: false,
                property: prop.value.length-1,
                accessor: childAccessor,
                struct: prop.type,
                type: prop.type,
                value: value
            }]
        ).concat(prop.value.slice(-1));
    }
    else {
        prop.value = value;
    }
    
    return layout;
});

function getValue(struct, propAccessor) {
    const accessors = propAccessor.split("/");
    return accessors
        .reduce(function(acc,curr) {
            return acc[curr];
        },struct);
}



*/