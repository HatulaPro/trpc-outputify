import { createProject, handleFile } from './file';

const project = createProject();
// const sourceFiles = project.getSourceFiles(["./src/server/api/routers/**.ts"]);
const sourceFiles = project.getSourceFiles(['./src/playground.ts']);

sourceFiles.forEach(handleFile(project));
project.saveSync();
