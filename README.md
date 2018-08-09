# CloudFormation Wait Deploy

![npm](https://img.shields.io/npm/v/cf-wait-deploy.svg)
![downloads](https://img.shields.io/npm/dm/cf-wait-deploy.svg)
![maintained](https://img.shields.io/badge/Maintained%20%3F-yes-green.svg)
[![GitHub issues](https://img.shields.io/github/issues/hlefebvr/cf-wait-deploy.svg)](https://github.com/hlefebvr/cf-wait-deploy/issues)
[![GitHub license](https://img.shields.io/github/license/hlefebvr/cf-wait-deploy.svg)](https://github.com/hlefebvr/cf-wait-deploy)

This node module enables you to deploy a cloudformation template and to wait for every resource to be created.

It returns a promise which resolves when the stack's status indicates all resources are deplyed or indicates a deployment error. In case of error, the promise is rejected.

You can install it via npm using `npm install --save-dev cf-wait-deploy`

You can also install it globally (see global documentation bellow) via npm `npm i -g cf-wait-deploy`

This module can be used for automated testing and integration.

# Documentation

## Constructor

```javascript
function CloudFormationDeploy(cloudformation, verbose = false, refreshRate = 500);
```

- **cloudformation** : an instanciated CloufFormation object from the AWS SDK
- **verbose** : boolean to indicate verbose mode (see below)
- **refreshRate** : refresh rate in milliseconds for pull CloudFormation events

## Usage Example

You can also use `await waitDeploy(deployParams)`

```javascript
const AWS = require("aws-sdk");

const CloudFormation = new AWS.CloudFormation({ region: "eu-west-1" });

const waitDeploy = require("cf-wait-deploy")(CloudFormation);
const deployParams = require("./deploy-params.js");

waitDeploy(deployParams).then(() =>
  console.log("All resources have been created")
);
```

with a `deploy-params.js` file as follow (this is an example) :

```javascript
module.exports = {
  StackName: "myStackName",
  TemplateBody: JSON.stringify({
    ssmParameterExample: {
      Type: "AWS::SSM::Parameter",
      Properties: {
        Name: `example-ssm`,
        Type: "String",
        Value: "this an example resource to deploy"
      }
    }
  })
};
```

# Verbose mode

When activated, verbose mode is powered by the excellent `table` node module and outputs results like so :

- In case of success :
  ![success deploy](https://raw.githubusercontent.com/hlefebvr/cf-wait-deploy/master/img/success_table.png)
- In case of faillure (plus a raised exception) :
  ![fail deploy](https://raw.githubusercontent.com/hlefebvr/cf-wait-deploy/master/img/fail_table.png)

# Global usage

You can use this as a global module as well. If installed globally, you can run :

```
cf-wait-deploy --stack-name exampleStackName --region eu-central-1 --tempalte-file ./tempalte.json
```

Available options are :

- `--region` : (Mandatory) the region you want to deploy to
- `--stack-name` : (Mandatory) you stack name
- `--template-file` : (at least one of template-file, template-body or template-url is mandatory) the path to a `.json` file or `.js` file exporting your template as an object
- `--template-url` : url of your template
- `--template-body` : body template in form of stringified JSON
- `--verbose` : false will disable verbose mode (which is enabled by default in command line)
- `--refresh-rate` : the refresh rate for pulling CloudFormation events
- `--role-arn` : the role you want to use while deploying your stack
- `--parameters` : stringified JSON to pass CF parameters
- `--capabilities` : (CAPABILITY_IAM | CAPABILITY_NAMED_IAM) the capability you want to use to deploy your stage

If you need any other parameter, please open an issue.
