import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Loads TypeScript sources from src/ for node:test without a build step, with
// the same "@/..." alias the app uses. Imported once per test file.
const requireModule = createRequire(import.meta.url);

requireModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

requireModule.extensions['.tsx'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  module._compile(outputText, filename);
};

export const srcPath = fileURLToPath(new URL('../../src', import.meta.url));

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  const target = request.startsWith('@/') ? path.join(srcPath, request.slice(2)) : request;
  return resolveFilename.call(this, target, ...rest);
};

process.env.BACKEND_URL ??= 'https://backend.test/';

export const loadSrc = (relativePath) => requireModule(path.join(srcPath, relativePath));

// A package resolved exactly as the sources resolve it, so a test and the code
// under test share one instance (React, React Query).
export const loadPackage = (name) => requireModule(name);
