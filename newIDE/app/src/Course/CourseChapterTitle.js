// @flow

import * as React from 'react';
import { Trans } from '@lingui/macro';

import type { CourseChapter, Course } from '../Utils/GDevelopServices/Asset';
import Text from '../UI/Text';
import { LineStackLayout } from '../UI/Layout';
import CheckCircle from '../UI/CustomSvgIcons/CheckCircle';
import GDevelopThemeContext from '../UI/Theme/GDevelopThemeContext';
import { useResponsiveWindowSize } from '../UI/Responsive/ResponsiveWindowMeasurer';
import type { CourseChapterCompletion } from '../MainFrame/EditorContainers/HomePage/UseCourses';
import Chip from '../UI/Chip';
import { freeChipStyle } from './CoursePreviewBanner';

const styles = {
  titleContainer: {
    flex: 1,
    display: 'flex',
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
};

type Props = {|
  course: Course,
  chapterIndex: number,
  courseChapter: CourseChapter,
  getChapterCompletion: (chapterId: string) => CourseChapterCompletion | null,
|};

const CourseChapterTitle = React.forwardRef<Props, HTMLDivElement>(
  ({ course, chapterIndex, courseChapter, getChapterCompletion }, ref) => {
    const gdevelopTheme = React.useContext(GDevelopThemeContext);
    const { isMobile, isLandscape } = useResponsiveWindowSize();
    const isMobilePortrait = isMobile && !isLandscape;
    const completion = getChapterCompletion(courseChapter.id);
    const isFinished = completion
      ? completion.completedTasks >= completion.tasks
      : false;

    return (
      <div
        ref={ref}
        style={{
          ...styles.titleContainer,
          flexDirection: isMobilePortrait ? 'column-reverse' : 'row',
          alignItems: isMobilePortrait ? 'flex-start' : 'center',
          justifyContent: 'space-between',
        }}
      >
        <LineStackLayout noMargin alignItems="center" expand>
          <Text size="title">
            {chapterIndex + 1}. {courseChapter.title}
          </Text>
          {isFinished && !isMobilePortrait && (
            <div
              style={{
                display: 'flex',
                color: gdevelopTheme.statusIndicator.success,
              }}
            >
              <CheckCircle />
            </div>
          )}
        </LineStackLayout>
        <LineStackLayout noMargin alignItems="center">
          {course.isLocked && courseChapter.isFree && (
            <Chip style={freeChipStyle} label={<Trans>Free!</Trans>} />
          )}
          {isFinished ? (
            <div
              style={{
                ...styles.statusContainer,
                color: gdevelopTheme.statusIndicator.success,
              }}
            >
              {isMobilePortrait && <CheckCircle />}
              <Text color="inherit" noMargin>
                <Trans>Finished</Trans>
              </Text>
            </div>
          ) : completion ? (
            <Text color="secondary" noMargin>
              <Trans>
                {completion.completedTasks} of {completion.tasks} completed
              </Trans>
            </Text>
          ) : null}
        </LineStackLayout>
      </div>
    );
  }
);

export default CourseChapterTitle;
