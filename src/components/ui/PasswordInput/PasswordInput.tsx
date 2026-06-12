import { forwardRef, useState } from 'react'
import classNames from 'classnames'
import pageStyles from '@/styles/page.module.css'
import styles from './PasswordInput.module.css'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputClassName?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ inputClassName, className, id, ...props }, ref) {
    const [isVisible, setIsVisible] = useState(false)

    return (
      <div className={classNames(styles.wrapper, className)}>
        <input
          ref={ref}
          id={id}
          type={isVisible ? 'text' : 'password'}
          className={classNames(pageStyles.input, styles.input, inputClassName)}
          {...props}
        />
        <button
          type="button"
          className={styles.toggle}
          aria-label={isVisible ? 'Скрыть пароль' : 'Показать пароль'}
          aria-controls={id}
          onClick={() => setIsVisible((current) => !current)}
        >
          {isVisible ? 'Скрыть' : 'Показать'}
        </button>
      </div>
    )
  },
)
