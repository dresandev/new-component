#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { program } from 'commander';

import {
  mkDirPromise,
  readFilePromiseRelative,
  writeFilePromise
} from './utils.js';
import {
  getConfig,
  buildPrettifier,
  createParentDirectoryIfNecessary,
  logIntro,
  logItemCompletion,
  logConclusion,
  logError,
} from './helpers.js';

import packageJSON from '../package.json' with { type: "json" };

(async function () {
  const config = getConfig();
  const prettify = await buildPrettifier(config.prettierConfig);

  program
    .version(packageJSON.version)
    .arguments('<componentName>')
    .option(
      '-l, --lang <language>',
      'Which language to use (default: "js")',
      /^(js|ts)$/i,
      config.lang
    )
    .option(
      '-d, --dir <pathToDirectory>',
      'Path to the "components" directory (default: "src/components")',
      config.dir
    )
    .parse(process.argv);

  const [componentName] = program.args;

  const options = program.opts();

  const fileExtension = options.lang === 'js' ? 'js' : 'tsx';
  const indexExtension = options.lang === 'js' ? 'js' : 'ts';
  const stylesExtension = 'css';

  // Find the path to the selected template file.
  const templatePath = `./templates/${options.lang}.js`;

  // Get all of our file paths worked out, for the user's project.
  const componentDir = `${options.dir}/${componentName}`;
  const filePath = `${componentDir}/${componentName}.${fileExtension}`;
  const stylesPath = `${componentDir}/${componentName}.module.${stylesExtension}`;
  const indexPath = `${componentDir}/index.${indexExtension}`;

  // Log introduction
  logIntro({
    name: componentName,
    dir: componentDir,
    lang: options.lang,
  });

  // Check if componentName is provided
  if (!componentName) {
    logError(
      `Sorry, you need to specify a name for your component like this: new-component <name>`
    );
    process.exit(0);
  }

  // Check to see if the parent directory exists.
  createParentDirectoryIfNecessary(options.dir);

  // Check to see if this component has already been created
  const fullPathToComponentDir = path.resolve(componentDir);
  try {
    await fs.access(fullPathToComponentDir);
    logError(
      `Looks like this component already exists! There's already a component at ${componentDir}.\nPlease delete this directory and try again.`
    );
    process.exit(0);
  } catch {
    // Directory does not exist, proceed
  }

  try {
    // Start by creating the directory that our component lives in.
    await mkDirPromise(componentDir);
    logItemCompletion('Directory created.');

    // Read the template file
    let template = await readFilePromiseRelative(templatePath);
    template = template.replace(/COMPONENT_NAME/g, componentName);

    // Format it using prettier, to ensure style consistency, and write to file.
    const prettyTemplate = await prettify(template);
    await writeFilePromise(filePath, prettyTemplate);
    logItemCompletion('Component built and saved to disk.');

    // Write the styles file
    await writeFilePromise(stylesPath, '');

    // Create and write the index file
    const prettyIndexTemplate = await prettify(`export * from './${componentName}';`);
    await writeFilePromise(indexPath, prettyIndexTemplate);
    logItemCompletion('Index file built and saved to disk.');

    // Log conclusion
    logConclusion();
  } catch (err) {
    logError(err);
    process.exit(1);
  }
})();