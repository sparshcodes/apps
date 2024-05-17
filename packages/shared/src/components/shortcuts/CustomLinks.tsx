import classNames from 'classnames';
import React, { MouseEventHandler, ReactElement } from 'react';
import { Button, ButtonSize, ButtonVariant } from '../buttons/Button';
import { SimpleTooltip } from '../tooltips/SimpleTooltip';
import { MenuIcon } from '../icons';
import { WithClassNameProps } from '../utilities';
import { combinedClicks } from '../../lib/click';
import { useFeedLayout } from '../../hooks';

interface CustomLinksProps extends WithClassNameProps {
  links: string[];
  onOptions?: () => unknown;
  onLinkClick?: MouseEventHandler;
}

const noop = () => undefined;

export function CustomLinks({
  links,
  onOptions,
  className,
  onLinkClick = noop,
}: CustomLinksProps): ReactElement {
  const { shouldUseMobileFeedLayout } = useFeedLayout();
  const pixelRatio = globalThis?.window?.devicePixelRatio ?? 1;
  const iconSize = Math.round(32 * pixelRatio);

  return (
    <div
      className={classNames(
        'hidden h-fit flex-row gap-2 rounded-14 border p-2',
        shouldUseMobileFeedLayout
          ? 'border-border-subtlest-tertiary tablet:flex'
          : 'border-border-subtlest-secondary laptop:flex',
        className,
      )}
    >
      {links.map((url, i) => (
        <a
          href={url}
          rel="noopener noreferrer"
          className={classNames(
            'focus-outline h-8 w-8 overflow-hidden rounded-8 bg-white',
            i >= 4 && 'hidden laptopL:block',
          )}
          key={url}
          {...combinedClicks(onLinkClick)}
        >
          <img
            src={`https://api.daily.dev/icon?url=${encodeURIComponent(
              url,
            )}&size=${iconSize}`}
            alt={url}
            className="h-full w-full"
          />
        </a>
      ))}
      <SimpleTooltip placement="left" content="Edit shortcuts">
        <Button
          variant={ButtonVariant.Tertiary}
          icon={
            <MenuIcon className={shouldUseMobileFeedLayout && 'rotate-90'} />
          }
          onClick={onOptions}
          size={ButtonSize.Small}
        />
      </SimpleTooltip>
    </div>
  );
}
