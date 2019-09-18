{
  qAlwaysFullyExpanded: {
	accessor: "qAlwaysFullyExpanded",
  	collapsed: true,
	enabled: true,
	type: "BOOLEAN",
	category: "PROPERTY",
	depth: 1,
	description: "foo",
	array: false,
	name: "qAlwaysFullyExpanded",
	value: {
		accessor: "qAlwaysFullyExpanded/value",
		collapsed: true,
		enabled: false,
		type: "BOOLEAN",
		category: "INPUT",
		depth: 2,
		value: true,
		default: true
	}
  },
  qDimensions: {
	accessor: "qDimensions",
	collapsed: true,
	enabled: true,
	type: "NxDimension",
	category: "PROPERTY",
	array: true,
    name: "qDimensions",
	depth: 1,
	value: [
	  {
		accessor: "qDimensions/value/0",
		collapsed: false,
		enabled: true,
		type: "NxDimension",
		category: "PROPERTY",
		name: 0,
		array: false,
		depth: 2,
		value: {
			qDef: {
			  accessor: "qDimensions/value/0/value/qDef",
			  collapsed: true,
			  enabled: true,
			  type: "String",
			  category: "PROPERTY",
			  name: "qDef",
			  array: false,
			  depth: 3,
			  value: {
			    accessor: "qDimensions/value/0/value/qDef/value",
				collapsed: false,
				enabled: true,
				type: "STRING",
				category: "INPUT",
				depth: 4,
				value: "Dim1",
				default: ""
			  }
			}
		}
	  },
	  {
		accessor: "qDimensions/value/add",
		collapsed: false,
		enabled: true,
		type: "ADD",
		category: "ADD",
		array: false,
		depth: 2
	  }
	]
}