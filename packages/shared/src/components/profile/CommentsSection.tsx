import React, { ReactElement } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import Link from 'next/link';
import { format } from 'date-fns';
import { USER_COMMENTS_QUERY, UserCommentsData } from '../../graphql/comments';
import { graphqlUrl } from '../../lib/config';
import UpvoteIcon from '../icons/Upvote';
import { largeNumberFormat } from '../../lib/numberFormat';
import ActivitySection from './ActivitySection';
import {
  EmptyMessage,
  CommentContainer,
  CommentContent,
  CommentTime,
  commentInfoClass,
} from './common';

export type CommentsSectionProps = {
  userId: string;
  tokenRefreshed: boolean;
  isSameUser: boolean;
  numComments: number;
};

export default function CommentsSection({
  userId,
  tokenRefreshed,
  isSameUser,
  numComments,
}: CommentsSectionProps): ReactElement {
  const comments = useInfiniteQuery<UserCommentsData>(
    ['user_comments', userId],
    ({ pageParam }) =>
      request(graphqlUrl, USER_COMMENTS_QUERY, {
        userId,
        first: 3,
        after: pageParam,
      }),
    {
      enabled: !!userId && tokenRefreshed,
      getNextPageParam: (lastPage) =>
        lastPage.page.pageInfo.hasNextPage && lastPage.page.pageInfo.endCursor,
    },
  );

  return (
    <ActivitySection
      title={`${isSameUser ? 'Your ' : ''}Comments`}
      query={comments}
      count={numComments}
      emptyScreen={
        <EmptyMessage data-testid="emptyComments">
          {isSameUser ? `You didn't comment yet.` : 'No comments yet.'}
        </EmptyMessage>
      }
      elementToNode={(comment) => (
        <CommentContainer key={comment.id}>
          <div className="flex w-12 flex-col items-center rounded-xl bg-theme-bg-secondary py-2 font-bold typo-callout tablet:w-20 tablet:flex-row tablet:justify-center">
            <UpvoteIcon className="icon mb-1 text-2xl tablet:mb-0 tablet:mr-1" />
            {largeNumberFormat(comment.numUpvotes)}
          </div>
          <Link href={comment.permalink} passHref prefetch={false}>
            <a className={commentInfoClass} aria-label={comment.content}>
              <CommentContent>{comment.content}</CommentContent>
              <CommentTime dateTime={comment.createdAt}>
                {format(new Date(comment.createdAt), 'MMM d, y')}
              </CommentTime>
            </a>
          </Link>
        </CommentContainer>
      )}
    />
  );
}
