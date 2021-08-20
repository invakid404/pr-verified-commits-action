import * as github from '@actions/github';
import { Commit, Maybe, Repository } from '@octokit/graphql-schema';
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
  cursor?: Maybe<string>,
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
              first: 1,
              ...(cursor && { after: cursor }),
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
            pageInfo: {
              endCursor: true,
              hasNextPage: true,
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

  const commits =
    pullRequest?.commits.nodes?.filter(notEmpty).map(({ commit }) => commit) ??
    [];

  const pageInfo = pullRequest?.commits?.pageInfo;

  if (pageInfo?.hasNextPage) {
    return [
      ...commits,
      ...(await getCommitsSignatureInfo(number, pageInfo.endCursor)),
    ];
  }

  return commits;
};
