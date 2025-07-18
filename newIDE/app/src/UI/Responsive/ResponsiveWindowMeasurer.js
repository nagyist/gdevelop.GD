// @flow
import * as React from 'react';
import useForceUpdate from '../../Utils/UseForceUpdate';
import useOnResize from '../../Utils/UseOnResize';

// Typically, small corresponds to mobile phones.
// Medium corresponds to tablets and small screens.
// Large corresponds to most laptop and desktop screens.
// Xlarge corresponds to large desktop screens.
export type WindowSizeType = 'small' | 'medium' | 'large' | 'xlarge';
const sizeThresholds = {
  smallHeight: 500,
  smallWidth: 600,
  mediumWidth: 1150,
  largeWidth: 1800,
};

type Props = {|
  children: ({
    windowSize: WindowSizeType,
    isMobile: boolean,
    isMediumScreen: boolean,
    isLandscape: boolean,
  }) => React.Node,
|};

/**
 * Wraps useResponsiveWindowSize in a component.
 */
export const ResponsiveWindowMeasurer = ({ children }: Props) =>
  children(useResponsiveWindowSize());

/**
 * Return the size of the window.
 * This considers a window to be "small" if *both* the width and height
 * are small.
 */
export const useResponsiveWindowSize = (): {
  windowSize: WindowSizeType,
  isMobile: boolean,
  isMediumScreen: boolean,
  isLandscape: boolean,
} => {
  useOnResize(useForceUpdate());

  if (typeof window === 'undefined') {
    return {
      windowSize: 'medium',
      isMobile: false,
      isMediumScreen: true,
      isLandscape: true,
    };
  }

  const isLandscape = window.innerWidth > window.innerHeight;

  return window.innerWidth < sizeThresholds.smallWidth ||
    window.innerHeight < sizeThresholds.smallHeight // Mobile devices can be in landscape mode, so check both width and height.
    ? {
        windowSize: 'small',
        isMobile: true,
        isMediumScreen: false,
        isLandscape,
      }
    : window.innerWidth < sizeThresholds.mediumWidth
    ? {
        windowSize: 'medium',
        isMobile: false,
        isMediumScreen: true,
        isLandscape,
      }
    : window.innerWidth < sizeThresholds.largeWidth
    ? {
        windowSize: 'large',
        isMobile: false,
        isMediumScreen: false,
        isLandscape,
      }
    : {
        windowSize: 'xlarge',
        isMobile: false,
        isMediumScreen: false,
        isLandscape,
      };
};
