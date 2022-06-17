import * as core from '@actions/core';
import * as github from '@actions/github';

import { getCommitsSignatureInfo } from './commits';
import { addLabelByName, removeLabelByName } from './labels';

(async (): Promise<void> => {
  if (!github.context.payload.pull_request) {
    core.info('No pull request found, exiting.');

    return;
  }

  const label = core.getInput('label');

  const { node_id: id, labels, number } = github.context.payload.pull_request;

  const commits = await getCommitsSignatureInfo(number);

  const hasUnsignedCommits = commits.some(
    ({ signature }) => !signature?.isValid,
  );
  if (hasUnsignedCommits) {
    if (label) {
      await addLabelByName({ id }, label);
    }

    core.setFailed('PR has unsigned commits!');

    return;
  }

  const hasLabel =
    label && labels.some((curr: { name: string }) => curr.name === label);

  if (hasLabel) {
    await removeLabelByName({ id }, label);
  }
})();
