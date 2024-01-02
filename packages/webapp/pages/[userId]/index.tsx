import React, {
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  addDays,
  endOfYear,
  startOfTomorrow,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';
import request from 'graphql-request';
import { graphqlUrl } from '@dailydotdev/shared/src/lib/config';
import {
  USER_READING_HISTORY_QUERY,
  USER_STATS_QUERY,
  UserReadHistory,
  UserStatsData,
  ProfileReadingData,
} from '@dailydotdev/shared/src/graphql/users';
import {
  ActivityContainer,
  ActivitySectionHeader,
  ActivitySectionTitle,
  ActivitySectionTitleStat,
} from '@dailydotdev/shared/src/components/profile/ActivitySection';
import { ReadingTagProgress } from '@dailydotdev/shared/src/components/profile/ReadingTagProgress';
import AuthContext from '@dailydotdev/shared/src/contexts/AuthContext';
import Rank from '@dailydotdev/shared/src/components/Rank';
import { RANKS, RankHistoryProps } from '@dailydotdev/shared/src/lib/rank';
import CommentsSection from '@dailydotdev/shared/src/components/profile/CommentsSection';
import PostsSection from '@dailydotdev/shared/src/components/profile/PostsSection';
import AuthorStats from '@dailydotdev/shared/src/components/profile/AuthorStats';
import { Dropdown } from '@dailydotdev/shared/src/components/fields/Dropdown';
import { useViewSize, ViewSize } from '@dailydotdev/shared/src/hooks';
import { weeklyGoal } from '@dailydotdev/shared/src/lib/constants';
import { ButtonSize } from '@dailydotdev/shared/src/components/buttons/ButtonV2';
import CalendarHeatmap from '../../components/CalendarHeatmap';
import {
  getLayout as getProfileLayout,
  getStaticProps as getProfileStaticProps,
  getStaticPaths as getProfileStaticPaths,
  ProfileLayoutProps,
} from '../../components/layouts/ProfileLayout';

export const getStaticProps = getProfileStaticProps;
export const getStaticPaths = getProfileStaticPaths;

const readHistoryToValue = (value: UserReadHistory): number => value.reads;
const readHistoryToTooltip = (
  value: UserReadHistory,
  date: Date,
): ReactNode => {
  const formattedDate = date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  if (!value?.reads) {
    return `No posts read on ${formattedDate}`;
  }
  return (
    <>
      <strong>
        {value.reads} article{value.reads > 1 ? 's' : ''} read
      </strong>
      &nbsp;on {formattedDate}
    </>
  );
};

const RankHistory = ({
  rank,
  rankName,
  count,
}: RankHistoryProps): ReactElement => (
  <div
    className="flex flex-col items-center rounded-12 border border-theme-bg-secondary p-2 font-bold typo-callout tablet:flex-row tablet:py-1 tablet:pl-2 tablet:pr-4"
    aria-label={`${rankName}: ${count}`}
  >
    <Rank className="h-8 w-8" rank={rank} colorByRank />
    <span className="ml-1 hidden text-theme-label-tertiary tablet:block">
      {rankName}
    </span>
    <span className="tablet:ml-auto">{count}</span>
  </div>
);

const BASE_YEAR = 2018;
const currentYear = new Date().getFullYear();
const dropdownOptions = [
  'Last year',
  ...Array.from(new Array(currentYear - BASE_YEAR + 1), (_, i) =>
    (currentYear - i).toString(),
  ),
];

const getHistoryTitle = (
  fullHistory: boolean,
  selectedHistoryYear: number,
): string => {
  if (fullHistory) {
    if (selectedHistoryYear > 0) {
      return dropdownOptions[selectedHistoryYear];
    }
    return 'the last year';
  }
  return 'the last months';
};

const ProfilePage = ({ profile }: ProfileLayoutProps): ReactElement => {
  const { user, tokenRefreshed } = useContext(AuthContext);
  const fullHistory = useViewSize(ViewSize.Laptop);
  const [selectedHistoryYear, setSelectedHistoryYear] = useState(0);
  const [before, after] = useMemo<[Date, Date]>(() => {
    if (!fullHistory) {
      const start = startOfTomorrow();
      return [start, subMonths(subDays(start, 2), 6)];
    }
    if (!selectedHistoryYear) {
      const start = startOfTomorrow();
      return [start, subYears(subDays(start, 2), 1)];
    }
    const selected = parseInt(dropdownOptions[selectedHistoryYear], 10);
    const startYear = new Date(selected, 0, 1);

    return [addDays(endOfYear(startYear), 1), startYear];
    // @NOTE see https://dailydotdev.atlassian.net/l/cp/dK9h1zoM
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHistoryYear]);
  const [readingHistory, setReadingHistory] =
    useState<ProfileReadingData>(null);

  const { data: remoteReadingHistory } = useQuery<ProfileReadingData>(
    ['reading_history', profile?.id, selectedHistoryYear],
    () =>
      request(graphqlUrl, USER_READING_HISTORY_QUERY, {
        id: profile?.id,
        before,
        after,
        version: 2,
        limit: 6,
      }),
    {
      enabled: !!profile && tokenRefreshed && !!before && !!after,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  );

  useEffect(() => {
    if (remoteReadingHistory) {
      setReadingHistory(remoteReadingHistory);
    }
  }, [remoteReadingHistory]);

  const totalReads = useMemo(
    () =>
      readingHistory?.userReadHistory.reduce((acc, val) => acc + val.reads, 0),
    [readingHistory],
  );

  const { data: userStats } = useQuery<UserStatsData>(
    ['user_stats', profile?.id],
    () =>
      request(graphqlUrl, USER_STATS_QUERY, {
        id: profile?.id,
      }),
    {
      enabled: !!profile && tokenRefreshed,
    },
  );

  const isSameUser = profile?.id === user?.id;

  const commentsSection = (
    <CommentsSection
      userId={profile?.id}
      tokenRefreshed={tokenRefreshed}
      isSameUser={isSameUser}
      numComments={userStats?.userStats?.numComments}
    />
  );

  const postsSection = (
    <PostsSection
      userId={profile?.id}
      isSameUser={isSameUser}
      numPosts={userStats?.userStats?.numPosts}
    />
  );

  return (
    <div className="relative flex flex-col items-stretch">
      {readingHistory?.userReadingRankHistory && (
        <>
          <ActivityContainer>
            <ActivitySectionHeader
              title="Weekly goal"
              subtitle="Learn how we count"
              clickableTitle="weekly goals"
              link={weeklyGoal}
            >
              <Dropdown
                className={{
                  container: 'ml-auto hidden w-32 min-w-fit laptop:block',
                }}
                selectedIndex={selectedHistoryYear}
                options={dropdownOptions}
                onChange={(val, index) => setSelectedHistoryYear(index)}
                buttonSize={ButtonSize.Small}
              />
            </ActivitySectionHeader>
            <div className="grid max-w-[17rem] grid-cols-5 gap-x-1 gap-y-3 tablet:max-w-full tablet:grid-cols-3 tablet:gap-2">
              {RANKS.map((rank) => (
                <RankHistory
                  key={rank.level}
                  rank={rank.level}
                  rankName={rank.name}
                  count={
                    readingHistory.userReadingRankHistory.find(
                      (history) => history.rank === rank.level,
                    )?.count ?? 0
                  }
                />
              ))}
            </div>
          </ActivityContainer>
          <ActivityContainer>
            <ActivitySectionHeader
              title="Top tags by reading days"
              subtitle="Learn how we count"
              clickableTitle="top tags"
              link={weeklyGoal}
            />
            <div className="grid max-w-[17rem] grid-cols-1 gap-3 tablet:max-w-full tablet:grid-cols-2 tablet:gap-x-10">
              {readingHistory.userMostReadTags?.map((tag) => (
                <ReadingTagProgress key={tag.value} tag={tag} />
              ))}
            </div>
          </ActivityContainer>
          <ActivityContainer>
            <ActivitySectionTitle>
              Posts read in {getHistoryTitle(fullHistory, selectedHistoryYear)}
              {totalReads >= 0 && (
                <ActivitySectionTitleStat>
                  ({totalReads})
                </ActivitySectionTitleStat>
              )}
            </ActivitySectionTitle>
            <CalendarHeatmap
              startDate={after}
              endDate={before}
              values={readingHistory.userReadHistory}
              valueToCount={readHistoryToValue}
              valueToTooltip={readHistoryToTooltip}
            />
            <div className="mt-4 flex items-center justify-between typo-footnote">
              <div className="text-theme-label-quaternary">
                Inspired by GitHub
              </div>
              <div className="flex items-center">
                <div className="mr-2">Less</div>
                <div
                  className="mr-0.5 h-2 w-2 border border-theme-divider-quaternary"
                  style={{ borderRadius: '0.1875rem' }}
                />
                <div
                  className="mr-0.5 h-2 w-2 bg-theme-label-disabled"
                  style={{ borderRadius: '0.1875rem' }}
                />
                <div
                  className="mr-0.5 h-2 w-2 bg-theme-label-quaternary"
                  style={{ borderRadius: '0.1875rem' }}
                />
                <div
                  className="mr-0.5 h-2 w-2 bg-theme-label-primary"
                  style={{ borderRadius: '0.1875rem' }}
                />
                <div className="ml-2">More</div>
              </div>
            </div>
          </ActivityContainer>
        </>
      )}
      {userStats?.userStats && (
        <>
          <AuthorStats userStats={userStats.userStats} />
          {postsSection}
          {commentsSection}
        </>
      )}
    </div>
  );
};

ProfilePage.getLayout = getProfileLayout;

export default ProfilePage;
