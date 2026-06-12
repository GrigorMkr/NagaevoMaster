import classNames from 'classnames'
import styles from './Spinner.module.css'

type SpinnerSize = 'sm' | 'md' | 'lg'

const SPINNER_SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: styles.sizeSmall as string,
  md: styles.sizeMedium as string,
  lg: styles.sizeLarge as string,
}

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      className={classNames(styles.spinner, SPINNER_SIZE_CLASS[size], className)}
      role="status"
      aria-label="Загрузка"
    />
  )
}
