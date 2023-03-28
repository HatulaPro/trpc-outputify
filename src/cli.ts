import inquirer from 'inquirer';
import { Command } from 'commander';

export type Options = {
	procedures: string[];
	tsConfigFilePath: string;
	files: string;
	filesChanged: number;
	proceduresChanged: number;
	silent: boolean;
};
export const defaultOptions: Options = {
	procedures: ['publicProcedure', 'protectedProcedure', 'procedure'],
	tsConfigFilePath: './tsconfig.json',
	files: './src/**.ts',
	filesChanged: 0,
	proceduresChanged: 0,
	silent: false,
};

export const bottomBar = new inquirer.ui.BottomBar();

export function parseArgs() {
	const program = new Command()
		.name('trpc-outputify')
		.description(
			'A simple tool to automatically add output validators to tRPC procedures'
		)
		.argument('[files]', 'Glob pattern to find files')
		.version('0.0.1', '-v, --version', 'Display the version number');

	program
		.option(
			'-c, --config <tsconfig>',
			'Path the local tsconfig.json',
			defaultOptions.tsConfigFilePath
		)
		.option(
			'-p, --procedures <procedures...>',
			'The names of the procedures',
			defaultOptions.procedures
		)
		.option('-s, --silent', 'silent mode, no output will be shown');
	program.parse();

	const options = program.opts();
	defaultOptions.files =
		(program.args[0] as string | undefined) ?? defaultOptions.files;
	defaultOptions.tsConfigFilePath = options.config as string;
	defaultOptions.procedures = options.procedures as string[];
	defaultOptions.silent = options.silent as boolean;

	return defaultOptions;
}
