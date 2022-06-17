import * as github from '@actions/github';
import { Commit, Repository } from '@octokit/graphql-schema';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';

import { octokit } from './octokit';
import { notEmpty, UnwrapMaybe } from './utils';

type CommitSignatureInfo = {
  oid: Commit['oid'];
  signature?: Pick<
    UnwrapMaybe<Commit['signature']>,
    'isValid' | 'state'
  > | null;
};

export const getCommitsSignatureInfo = async (
  number: Number,
): Promise<CommitSignatureInfo[]> => {
  const request = {
    query: {
      repository: {
        __args: {
          owner: github.context.repo.owner,
          name: github.context.repo.repo,
        },
        pullRequest: {
          __args: {
            number,
          },
          commits: {
            __args: {
              first: 100,
            },
            nodes: {
              commit: {
                oid: true,
                signature: {
                  isValid: true,
                  state: true,
                },
              },
            },
          },
        },
      },
    },
  };

  const {
    repository: { pullRequest },
  }: { repository: Partial<Repository> } = await octokit(
    jsonToGraphQLQuery(request),
  );

  return (
    pullRequest?.commits.nodes?.filter(notEmpty).map(({ commit }) => commit) ??
    []
  );
};
