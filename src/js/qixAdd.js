export default class QixAdd {
    constructor(type,inherit = {}) {
        const init = {
            accessor: "",
            type: "ADD",
            category: "ADD",
            dataType: type,
            depth: 0
        };

        Object.assign(this,init,inherit);
    }
}

/*accessor: "qDimensions/value/add",
		collapsed: false,
		enabled: true,
		type: "ADD",
		category: "ADD",
		array: false,
		depth: 2
    */