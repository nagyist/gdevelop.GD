// @flow
import * as React from 'react';
import MuiLink from '@material-ui/core/Link';
import GDevelopThemeContext from './Theme/GDevelopThemeContext';
import { type GDevelopTheme } from './Theme';
import { makeStyles } from '@material-ui/core/styles';

type Props = {|
  children: React.Node,
  href: string,
  onClick: () => void | Promise<void>,
  disabled?: boolean,
  color?: 'primary' | 'secondary' | 'inherit',
|};

const useLinkStyles = (
  theme: GDevelopTheme,
  color: 'primary' | 'secondary' | 'inherit',
  disabled: boolean
) =>
  makeStyles({
    root: {
      color:
        color === 'inherit'
          ? 'inherit'
          : color === 'primary'
          ? theme.link.color.default
          : undefined,
      textDecoration: 'underline',
      '&:hover': {
        color:
          color === 'primary' && !disabled ? theme.link.color.hover : undefined,
        cursor: !disabled ? 'pointer' : 'default',
      },
      '&:focus': {
        color:
          color === 'primary' && !disabled ? theme.link.color.hover : undefined,
      },
    },
  })();

const Link = (props: Props) => {
  const gdevelopTheme = React.useContext(GDevelopThemeContext);
  const linkStyles = useLinkStyles(
    gdevelopTheme,
    props.color || 'primary',
    !!props.disabled
  );
  const onClick = (event: MouseEvent) => {
    event.preventDefault(); // Avoid triggering the href (avoids a warning on mobile in case of unsaved changes).
    if (!props.disabled) {
      props.onClick();
    }
  };
  return (
    <MuiLink
      color="secondary"
      href={props.href}
      onClick={onClick}
      classes={linkStyles}
    >
      {props.children}
    </MuiLink>
  );
};

export default Link;
