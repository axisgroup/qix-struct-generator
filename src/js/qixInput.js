export default class QixInput {
    constructor(type,inherit = {}) {
        const init = {
            accessor: "",
            type: type,
            category: "INPUT",
            depth: 0,
            name: name,
            value: undefined
        };

        Object.assign(this,init,inherit);
       
        if(this.type === "Boolean") {
            this.value = (typeof this.value === "undefined") ? "false" : this.value.toLowerCase();
            this.options = ["true","false"];
        }

        if(typeof this.options != "undefined") {
            this.value = (typeof this.value === "undefined") ? this.options[0] : this.value;
        }

        // element type
        this.elemType = (typeof this.options != "undefined") ? "dropdown" : "input";
    }
}


/*
accessor: "qAlwaysFullyExpanded/value",
		collapsed: true,
		enabled: false,
		type: "BOOLEAN",
		category: "INPUT",
		depth: 2,
		value: true,
		default: true
*/