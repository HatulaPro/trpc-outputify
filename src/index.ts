import { Project } from 'ts-morph';
import { handleFile } from './file';

const project = new Project({
	compilerOptions: {
		tsConfigFilePath: './tsconfig.json',
	},
});

project.addSourceFilesFromTsConfig('./tsconfig.json');
// const sourceFiles = project.getSourceFiles(["./src/server/api/routers/**.ts"]);
const sourceFiles = project.getSourceFiles(['./src/playground.ts']);

sourceFiles.forEach(handleFile(project));
project.saveSync();
