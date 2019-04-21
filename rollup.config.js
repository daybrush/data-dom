
import builder from "@daybrush/builder";

export default builder([
    {
        name: "DataDOM",
        input: "src/index.ts",
        output: "./dist/datadom.js",
    },
    {
        name: "DataDOM",
        input: "src/index.ts",
        output: "./dist/datadom.js",
        uglify: true,

    },
    {
        name: "DataDOM",
        input: "src/index.ts",
        output: "./dist/datadom.pkgd.js",
        resolve: true,
    },
    {
        name: "DataDOM",
        input: "src/index.ts",
        output: "./dist/datadom.pkgd.min.js",
        resolve: true,
        uglify: true,
    },
    {
        input: "src/index.ts",
        output: "./dist/datadom.esm.js",
        exports: "named",
        format: "es",
    },
]);
