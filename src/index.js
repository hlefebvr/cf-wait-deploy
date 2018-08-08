/* eslint-disable no-await-in-loop, no-underscore-dangle */

const { createStream } = require("table");

async function sleep(refreshRate) {
  return new Promise(resolve => setTimeout(resolve, refreshRate));
}

function CloudFormationDeploy(
  cloudformation,
  verbose = false,
  refreshRate = 500
) {
  function log(txt) {
    if (verbose) console.log(txt);
  }

  function eventManager() {
    let firstRead = true;
    const history = {};
    const stream = createStream({
      columnDefault: { width: 30 },
      columnCount: 5,
      columns: {
        0: { width: 20 },
        3: { width: 20 },
        4: { width: 20 }
      }
    });
    stream.write(["Time", "Logical Id", "Type", "Status", "Reason"]);
    return {
      report(events) {
        events.StackEvents.forEach(event => {
          const {
            EventId,
            Timestamp,
            LogicalResourceId,
            ResourceType,
            ResourceStatus,
            ResourceStatusReason
          } = event;
          if (!(EventId in history)) {
            history[EventId] = true;
            if (!firstRead)
              stream.write([
                Timestamp.toTimeString().split(" ")[0],
                LogicalResourceId,
                ResourceType,
                ResourceStatus,
                ResourceStatusReason
              ]);
          }
        });
        firstRead = false;
      }
    };
  }

  async function createOrReplaceStack(params) {
    try {
      await cloudformation.createStack(params).promise();
      log(`Create ${params.StackName} stack...`);
      return "CREATE";
    } catch (errCreate) {
      if (errCreate.code === "AlreadyExistsException") {
        try {
          await cloudformation.updateStack(params).promise();
        } catch (errUpdate) {
          if (errUpdate.message === "No updates are to be performed.") {
            log(errUpdate.message);
            return "ABORT";
          }
          throw errUpdate;
        }
        log(`Update ${params.StackName} stack...`);
        return "UPDATE";
      }
      throw errCreate;
    }
  }

  function getExpectedStatus(status) {
    return [
      `${status}_COMPLETE`,
      `${status}_ROLLBACK_COMPLETE`,
      "ROLLBACK_COMPLETE"
    ];
  }

  async function waitFor(stackName, statusList) {
    let _status;
    const _events = eventManager(verbose);
    do {
      const [events, stack] = await Promise.all([
        cloudformation.describeStackEvents({ StackName: stackName }).promise(),
        cloudformation.describeStacks({ StackName: stackName }).promise()
      ]);
      _events.report(events);
      _status = stack.Stacks[0].StackStatus;
      await sleep(refreshRate);
    } while (!statusList.includes(_status));

    if (_status.match("ROLLBACK") || _status.match("FAIL"))
      await Promise.reject(`Deploy ended with status ${_status}`);
  }

  async function deploy(params) {
    const { TemplateBody, TemplateURL, StackName } = params;
    await cloudformation.validateTemplate({ TemplateBody, TemplateURL });
    const type = await createOrReplaceStack(params);
    if (type === "ABORT") return;
    const status = getExpectedStatus(type);
    await waitFor(StackName, status);
  }
  return { deploy };
}

module.exports = CloudFormationDeploy;
