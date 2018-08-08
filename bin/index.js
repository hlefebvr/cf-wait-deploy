#!/usr/bin/env node

/* eslint-disable global-require, import/no-dynamic-require, no-continue */

const AWS = require("aws-sdk");

const args = process.argv.splice(process.execArgv.length + 2);

const params = { params: {}, verbose: "true" };

const parameterStore = {
  params: {
    "--template-body": "TemplateBody",
    "--template-url": "TemplateURL",
    "--stack-name": "StackName",
    "--parameters": "Parameters",
    "--role-arn": "RoleArn",
    "--capabilities": "Capabilities"
  },
  "--region": "region",
  "--verbose": "verbose",
  "--refresh-rate": "refreshRate"
};

const handleTemplateFile = i => {
  const path = `${process.cwd()}/${args[i + 1]}`;
  if (path.endsWith(".js") || path.endsWith(".json"))
    params.params.TemplateBody = JSON.stringify(require(path));
  else throw new Error("Allowed extensions for template file are .json or .js");
};

for (let i = 0; i < args.length; i += 1) {
  const argument = args[i];
  if (argument in parameterStore) {
    params[parameterStore[argument]] = args[i + 1];
  } else if (argument === "--template-file") {
    handleTemplateFile(i);
  } else if (argument in parameterStore.params) {
    params.params[parameterStore.params[argument]] = args[i + 1];
  } else {
    throw new Error(`Unknown argument ${argument}`);
  }
  i += 1;
}

const CloudFormation = new AWS.CloudFormation({ region: params.region });

const waitDeploy = require("../src/index")(
  CloudFormation,
  params.verbose === "true",
  params.refreshRate || 500
);

waitDeploy.deploy(params.params);
