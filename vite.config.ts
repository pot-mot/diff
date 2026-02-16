/// <reference types="vitest/config" />
import {defineConfig} from "vite";
import dts from "vite-plugin-dts";
import {resolve} from "path";

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: '@potmot/diff',
            formats: ['es', 'umd'],
            fileName: 'index'
        },
    },
    plugins: [
        dts({
            tsconfigPath: './tsconfig.node.json',
            include: ['src/**/*.ts'],
        })
    ],
    test: {
        globals: false,
        environment: 'node',
    },
});
