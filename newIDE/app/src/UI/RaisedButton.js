// @flow
import * as React from 'react';
import Button from '@material-ui/core/Button';
import { type ButtonInterface } from './Button';
import { Spacer } from './Grid';
import classes from './RaisedButton.module.css';
import classNames from 'classnames';

// We support a subset of the props supported by Material-UI v0.x RaisedButton
// They should be self descriptive - refer to Material UI docs otherwise.
export type RaisedButtonPropsWithoutOnClick = {|
  label?: React.Node,
  primary?: boolean,
  color?: 'primary' | 'success' | 'danger' | 'premium',
  size?: 'medium' | 'large',
  disabled?: boolean,
  keyboardFocused?: boolean,
  fullWidth?: boolean,
  icon?: React.Node,
  rightIcon?: React.Node,
  style?: {|
    marginTop?: number,
    marginBottom?: number,
    marginLeft?: number,
    marginRight?: number,
    margin?: number,
    flexShrink?: 0,
  |},
  id?: ?string,
|};

export type RaisedButtonProps = {|
  ...RaisedButtonPropsWithoutOnClick,
  onClick: ?(MouseEvent) => void | Promise<void>,
|};

/**
 * A raised button based on Material-UI button.
 */
const RaisedButton = React.forwardRef<RaisedButtonProps, ButtonInterface>(
  (
    {
      label,
      primary,
      color,
      size,
      icon,
      rightIcon,
      disabled,
      keyboardFocused,
      style,
      ...otherProps
    }: RaisedButtonProps,
    ref
  ) => {
    // In theory, focus ripple is only shown after a keyboard interaction
    // (see https://github.com/mui-org/material-ui/issues/12067). However, as
    // it's important to get focus right in the whole app, make the ripple
    // always visible to be sure we're getting focusing right.
    const focusRipple = true;

    return (
      <Button
        variant="contained"
        size={size || 'small'}
        disableElevation
        color={primary || color === 'primary' ? 'primary' : 'default'}
        autoFocus={keyboardFocused}
        focusRipple={focusRipple}
        disabled={disabled}
        className={classNames({
          [classes.buttonSuccess]: color === 'success',
          [classes.buttonDanger]: color === 'danger',
          [classes.buttonPremium]: color === 'premium',
        })}
        style={
          style || !label
            ? {
                // If no label is specified, reduce the min width so that the button
                // is just around the icon.
                minWidth: !label ? 0 : undefined,
                ...style,
              }
            : undefined
        }
        {...otherProps}
        ref={ref}
      >
        {icon}
        {!!icon && !!label && <Spacer />}
        {/* span element is required to prevent browser auto translators to crash the app - See https://github.com/4ian/GDevelop/issues/3453 */}
        {label ? <span>{label}</span> : null}
        {!!rightIcon && !!label && <Spacer />}
        {rightIcon}
      </Button>
    );
  }
);

export default RaisedButton;
