import type { Project, SourceFile } from 'ts-morph';
import { handleProcedure } from './procedure';
import { Travelers } from './travelers';

export function handleFile(p: Project) {
	return (sourceFile: SourceFile) => {
		sourceFile.forEachDescendant((node) => {
			handleProcedure(p, node, (procedure) => {
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
	};
}
