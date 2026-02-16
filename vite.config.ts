/// <reference types="vitest/config" />
import {defineConfig} from "vite";
import dts from "vite-plugin-dts";
import {resolve} from "path";

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/main.ts'), // 使用绝对路径
            name: 'PotmotDiff',
            fileName: 'potmot-diff',
        },
    },
    plugins: [
        dts({
            insertTypesEntry: true,
            rollupTypes: true,
            tsconfigPath: './tsconfig.node.json', // 指定 tsconfig 路径
            outDir: 'dist', // 输出目录
        })
    ],
    test: {
        globals: false,
        environment: 'node',
    },
});
