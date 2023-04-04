#!/usr/bin/env node
import { parseArgs } from './cli';
import { createProject, handleFile } from './file';

function main() {
	const options = parseArgs();

	const project = createProject(options.tsConfigFilePath);

	const sourceFiles = project.getSourceFiles(options.files);

	if (!options.silent) {
		console.log(`Scanning ${sourceFiles.length} files at ${options.files}`);
	}

	sourceFiles.forEach(handleFile(project, options));

	project.saveSync();

	if (!options.silent) {
		console.log(
			`Modified ${options.filesChanged} files (${options.proceduresChanged} procedures updated)`
		);
	}
}

try {
	void main();
	process.exit(0);
} catch (e) {
	if (e instanceof Error) {
		console.error(e.message);
		process.exit(1);
	}
}
