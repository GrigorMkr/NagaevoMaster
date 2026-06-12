import classNames from 'classnames'
import { Link, type LinkProps } from 'react-router-dom'
import styles from './Button.module.css'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'light'
  | 'glass'
  | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={classNames(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
