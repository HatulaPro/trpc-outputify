import { parseArgs } from './cli';
import { createProject, handleFile } from './file';

function main() {
	const defaultOptions = parseArgs();

	const project = createProject(defaultOptions.tsConfigFilePath);

	// const sourceFiles = project.getSourceFiles(['./src/playground.ts']);
	const sourceFiles = project.getSourceFiles(defaultOptions.files);
	sourceFiles.forEach(handleFile(project, defaultOptions));

	project.saveSync();
}

void main();
