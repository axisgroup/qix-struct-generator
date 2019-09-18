import structsRaw from "raw!../../structs.json";
import QixInput from "./qixInput";
import QixAdd from "./qixAdd";
const structs = JSON.parse(structsRaw);

export default class QixProperty {
    constructor(name,inherit = {}) {
        
        const init = {
            accessor: name,
            enabled: false,
            collapsed: true,
            type: name,
            category: "PROPERTY",
            depth: 0,
            description: "",
            array: false,
            name: name,
            value: {}
        };

        Object.assign(this,init,inherit);

        // For single input
        if(this.array) {
            this.value = [
                new QixAdd(this.type,{
                    accessor: this.accessor + "/value/add",
                    parentAccessor: this.accessor + "/value",
                    depth: this.depth+1
                })
            ];
        }
        else if(["Integer","String","Boolean"].indexOf(this.type)>-1) {
            this.value = new QixInput(this.type,{
                depth: this.depth,
                accessor: this.accessor + "/value",
                value: this.default,
                options: this.options
            });
        }
        // For custom QIX data type
        else {
            const structProperties = structs.filter(f => f.struct === this.type);
            this.value = structProperties.reduce((acc,curr) => {
                const structName = curr.property;
                acc[structName] = new QixProperty(structName,{
                    accessor: this.accessor + "/value/" + structName,
                    depth: this.depth + 1,
                    array: curr.array !== "FALSE",
                    type: curr.type,
                    description: curr.description,
                    default: curr.default,
                    options: (typeof curr.options != "undefined") ? curr.options.split(",") : undefined
                });
                
                return acc;
            },{});
        }
    }
}

// if curr.type === qix object, new property breakout
// elseif its an input, return the input
