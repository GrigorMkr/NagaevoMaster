import classNames from 'classnames'
import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from '@/components/ui/Spinner/Spinner'
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

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={classNames(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" className={styles.spinnerIcon} />}
      {children}
    </button>
  )
}
