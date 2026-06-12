import classNames from 'classnames';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './Button.module.css';
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'light' | 'glass' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
    sm: styles.sizeSmall as string,
    md: styles.sizeMedium as string,
    lg: styles.sizeLarge as string,
};
interface ButtonLinkProps extends LinkProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
}
function ButtonLink({ variant = 'primary', size = 'md', fullWidth = false, className, children, ...props }: ButtonLinkProps) {
    return (<Link className={classNames(styles.button, styles[variant], BUTTON_SIZE_CLASS[size], fullWidth && styles.fullWidth, className)} {...props}>
      {children}
    </Link>);
}

export {
  ButtonLink,
}
