// @flow
const csb = require('codesandboxer');
/*::
import type { Config } from './types';
*/
const { getBaseFiles, baseExtensions } = require('./constants');
const loadFiles = require('./loadFiles');
const resolve = require('resolve');

const fs = require('fs');
const path = require('path');
const pkgDir = require('pkg-dir');

const getAbsFilePath = (relFilePath, extensions) => {
  try {
    let firstPathResolve = path.resolve(relFilePath);
    let a = resolve.sync(firstPathResolve, { extensions });
    return a;
  } catch (e) {
    throw {
      key: 'noExampleFile',
      relFilePath,
    };
  }
};

const getPkgJSONPath = rootDir => {
  let fixedPath = `${rootDir}/package.json`;
  try {
    return resolve.sync(fixedPath);
  } catch (e) {
    throw {
      key: 'noPKGJSON',
      fixedPath,
    };
  }
};

async function assembleFiles(filePath /*: string */, config /*: ?Config */) {
  if (!config) config = {};
  let extension = path.extname(filePath);
  let extensions = ['.js'];
  if (config.extensions) extensions = [...extensions, config.extensions];
  if (
    extension &&
    !baseExtensions.includes(extension) &&
    !extensions.includes(extension)
  ) {
    extensions.push(extension);
  }

  let rootDir = await pkgDir(filePath);
  let absFilePath = getAbsFilePath(filePath, extensions);
  let pkgJSONPath = getPkgJSONPath(rootDir);
  let relFilePath = path.relative(rootDir, filePath);

  // $FlowFixMe - we genuinely want dynamic requires here
  let pkgJSON = require(pkgJSONPath);
  let exampleContent = fs.readFileSync(absFilePath, 'utf-8');

  let { file, deps, internalImports } = await csb.parseFile(
    exampleContent,
    pkgJSON,
  );

  let newFileLocation = `example${extension || '.js'}`;

  let files = Object.assign({}, getBaseFiles(newFileLocation), {
    [newFileLocation]: {
      content: csb.replaceImports(
        file,
        internalImports.map(m => [m, `./${csb.resolvePath(relFilePath, m)}`]),
      ),
    },
  });

  let final = await loadFiles({
    files,
    deps,
    rootDir,
    pkgJSON,
    extensions,
    internalImports: internalImports.map(m =>
      csb.resolvePath(path.relative(rootDir, filePath), m),
    ),
    priorPaths: [],
  });

  if (Object.keys(final.files).length > 120) throw { key: 'tooManyModules' };
  return csb.finaliseCSB(final, config);
}

module.exports = assembleFiles;
