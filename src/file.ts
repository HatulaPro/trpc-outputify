import { type Options } from './cli';
import { Project, type SourceFile, SyntaxKind } from 'ts-morph';
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
		if (!options.silent) {
			console.log('Parsing file: ' + sourceFile.getBaseName());
		}
		const numOfProceduresChanged = options.proceduresChanged;
		const updateProceduresChangedCount = () => {
			options.proceduresChanged++;
		};
		sourceFile.forEachDescendant((node) => {
			handleProcedure(p, options, node, (procedure) => {
				const rpcSecion =
					procedure.propAccessExprsMap.get('query') ||
					procedure.propAccessExprsMap.get('mutation');
				if (!rpcSecion) return;
				const inputSection = procedure.propAccessExprsMap
					.get('input')
					?.getParentIfKind(SyntaxKind.CallExpression);
				const outputSection = procedure.propAccessExprsMap
					.get('output')
					?.getParentIfKind(SyntaxKind.CallExpression);
				// If no .output, create the output and put it right after the input
				if (!outputSection && inputSection) {
					inputSection.transform(
						Travelers.addOutputAfterInput(procedure)
					);
				} else if (outputSection) {
					if (
						!options.silent &&
						!outputSection
							.getFullText()
							.includes('/* BEGIN GENERATED CONTENT */') &&
						!outputSection
							.getFullText()
							.includes('/* END GENERATED CONTENT */')
					) {
						console.warn(
							`Warning: rewriting existing output for procedure \`${procedure.name}\``
						);
					}

					// If there is an output already, update it
					outputSection.transform(
						Travelers.updateExistingOutput(
							procedure,
							updateProceduresChangedCount
						)
					);
				} else {
					// If there is no output and no input section, create the output section
					rpcSecion
						.getParent()!
						.transform(Travelers.addOutputBeforeRPC(procedure));
				}
			});
		});
		// If file changed, format it
		if (!sourceFile.isSaved()) {
			options.filesChanged++;
			if (!options.silent) {
				console.log(
					`Modified ${sourceFile.getBaseName()} (${
						options.proceduresChanged - numOfProceduresChanged
					} procedures updated)`
				);
			}
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
