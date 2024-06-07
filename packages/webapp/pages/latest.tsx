import React, { ReactElement } from 'react';
import { NextSeoProps } from 'next-seo/lib/types';
import { NextSeo } from 'next-seo';
import {
  getMainFeedLayout,
  mainFeedLayoutProps,
} from '../components/layouts/MainFeedPage';
import { defaultOpenGraph, defaultSeo } from '../next-seo';

const seo: NextSeoProps = {
  title: 'Popular posts on daily.dev',
  openGraph: { ...defaultOpenGraph },
  ...defaultSeo,
};

const Latest = (): ReactElement => {
  return (
    <>
      <NextSeo {...seo} />
    </>
  );
};

Latest.getLayout = getMainFeedLayout;
Latest.layoutProps = mainFeedLayoutProps;

export default Latest;
