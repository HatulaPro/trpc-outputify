import { Project, ScriptTarget } from 'ts-morph';
import { handleFile } from './file';

export const project = new Project({
	compilerOptions: {
		tsConfigFilePath: './tsconfig.json',
		strict: true,
		target: ScriptTarget.ES2020,
	},
});
project.addSourceFilesFromTsConfig('./tsconfig.json');
// const sourceFiles = project.getSourceFiles(["./src/server/api/routers/**.ts"]);
const sourceFiles = project.getSourceFiles(['./src/playground.ts']);

sourceFiles.forEach(handleFile(project));
project.saveSync();
