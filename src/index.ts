import { exit } from 'process';
import { bottomBar, parseArgs } from './cli';
import { createProject, handleFile } from './file';

function main() {
	const options = parseArgs();

	const project = createProject(options.tsConfigFilePath);

	const sourceFiles = project.getSourceFiles(options.files);

	if (!options.silent) {
		bottomBar.log.write(
			`Scanning ${sourceFiles.length} files at ${options.files}`
		);
	}

	sourceFiles.forEach(handleFile(project, options));

	project.saveSync();

	if (!options.silent) {
		bottomBar.updateBottomBar(
			`Modified ${options.filesChanged} files (${options.proceduresChanged} procedures updated)`
		);
	}
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
