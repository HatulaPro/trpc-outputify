import { type Options } from './cli';
import { Project, type SourceFile } from 'ts-morph';
import { handleProcedure } from './procedure';
import { Travelers } from './travelers';

export function createProject(tsConfigFilePath: string) {
	try {
		const project = new Project({
			tsConfigFilePath: tsConfigFilePath,
		});
		project.addSourceFilesFromTsConfig(tsConfigFilePath);

		return project;
	} catch {
		throw new Error('error: Invalid TypeScript config file');
	}
}

export function handleFile(p: Project, options: Options) {
	return (sourceFile: SourceFile) => {
		sourceFile.forEachDescendant((node) => {
			handleProcedure(p, options, node, (procedure) => {
				const rpcSecion =
					procedure.propAccessExprsMap.get('query') ||
					procedure.propAccessExprsMap.get('mutation');
				if (!rpcSecion) return;
				const inputSection = procedure.propAccessExprsMap
					.get('input')
					?.getParent();
				const outputSection = procedure.propAccessExprsMap
					.get('output')
					?.getParent();

				// If no .output, create the output and put it right after the input
				if (!outputSection && inputSection) {
					inputSection.transform(
						Travelers.addOutputAfterInput(procedure)
					);
				} else if (outputSection) {
					// If there is an output already, update it
					outputSection.transform(
						Travelers.updateExistingOutput(procedure)
					);
				} else {
					// If there is no output and no input section, create the output section

					rpcSecion
						.getParent()
						?.transform(Travelers.addOutputBeforeRPC(procedure));
				}
			});
		});
		// If file changed, format it
		if (!sourceFile.isSaved()) {
			addZodImportIfNotExists(sourceFile);
			sourceFile.formatText();
		}
	};
}

function addZodImportIfNotExists(sourceFile: SourceFile) {
	const declaration = sourceFile.getImportDeclaration((importDeclaration) => {
		return (
			importDeclaration
				.getNamedImports()
				.map((x) => x.getName())
				.includes('z') &&
			importDeclaration.getModuleSpecifierValue() === 'zod'
		);
	});
	if (!declaration) {
		if (sourceFile.getLocal('z')) {
			throw new Error(
				'Can not import zod: symbol `z` is already defined.'
			);
		}
		sourceFile.addImportDeclaration({
			moduleSpecifier: 'zod',
			namedImports: ['z'],
		});
	}
}
