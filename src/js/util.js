let curry = (f, ...args) => {
    if (f.length <= args.length) return f(...args);
    return (...more) => curry(f, ...args, ...more);
};

export {curry};