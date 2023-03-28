import { exit } from 'process';
import { bottomBar, parseArgs } from './cli';
import { createProject, handleFile } from './file';

function main() {
	const defaultOptions = parseArgs();

	const project = createProject(defaultOptions.tsConfigFilePath);

	// const sourceFiles = project.getSourceFiles(['./src/playground.ts']);
	const sourceFiles = project.getSourceFiles(defaultOptions.files);
	bottomBar.log.write(
		`Scanning ${sourceFiles.length} files at ${defaultOptions.files}`
	);
	sourceFiles.forEach(handleFile(project, defaultOptions));

	project.saveSync();

	bottomBar.updateBottomBar(
		`Modified ${defaultOptions.filesChanged} files (${defaultOptions.proceduresChanged} procedures)`
	);
	exit(0);
}

try {
	void main();
} catch (e) {
	if (e instanceof Error) {
		console.error(e.message);
		exit(1);
	}
}
