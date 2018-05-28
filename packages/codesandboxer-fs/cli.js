#!/usr/bin/env node
// @flow
'use strict';

const meow = require('meow');
const { assembleFiles, assembleFilesAndPost } = require('./index');
const path = require('path');

let cli = meow(
  `
    Usage
      $ codesandboxer <filePath>
      upload the file, and other files within its package, to codesandbox.

    Options
      --dry, -D Instead of deploying, display what will be deployed
      --name, -n Name your sandbox

      Unimplemented options (coming soon)
      --allowedExtensions List of extensions that will be treated as if they
      were javascript files. Most common examples are .jsx or .ts files
      --files, -f Provide a list of files that will be included even if they do
      not end up in the graph. Format: fileA.js,fileB.js,fileC.js
      --dependencies -d A list of dependencies to include, even if they are not
      mentioned

    Examples
      $ codesandboxer some/react/component.js
`,
  {
    flags: {
      dry: {
        type: 'boolean',
        alias: 'D',
      },
      list: {
        type: 'boolean',
        alias: 'l',
      },
      name: {
        type: 'string',
        alias: 'n',
      },
    },
  },
);

async function CLIStuff(cliData) {
  let [filePath] = cliData.input;

  if (cliData.flags.allowJSXExtension) {
    return console.error(
      'The allowJSXExtension flag has not yet been implemented',
    );
  }
  if (cliData.flags.list) {
    return console.error('The list flag has not yet been implemented');
  }
  if (cliData.flags.files) {
    return console.error(
      'We have not implemented the files flag yet to allow you to pass in custom files',
    );
  }
  if (cliData.flags.dependencies) {
    return console.error('We have not implemented the dependencies flag yet.');
  }

  if (!filePath) {
    return console.error(
      'No filePath was passed in. Please pass in the path to the file you want to sandbox',
    );
  }

  try {
    if (cliData.flags.dry) {
      let results = await assembleFiles(filePath);
      console.log(
        'dry done, here is a list of the files to be uploaded:\n',
        Object.keys(results.files).join('\n'),
      );
    } else {
      let results = await assembleFilesAndPost(filePath, {
        name: cliData.flags.name,
      });
      console.log(results);
    }
  } catch (e) {
    switch (e.key) {
      case 'noPKGJSON':
        return console.error(
          `we could not resolve a package.json at ${e.fixedPath}`,
        );
      case 'noExampleFile':
        return console.error(
          `we could not resolve the example file ${filePath}\nWe tried to resolve this at: ${path.resolve(
            process.cwd(),
            e.relFilePath,
          )}`,
        );
      case 'tooManyModules':
        return console.error(
          "The number of files this will upload to codesandbox is Too Damn High, and we can't do it, sorry.",
        );
      default:
        return console.error(e);
    }
  }
}

CLIStuff(cli);
