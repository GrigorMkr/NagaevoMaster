import { Children, type CSSProperties, type ReactNode } from 'react';
import classNames from 'classnames';
import styles from './Reveal.module.css';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  style?: CSSProperties;
}

function Reveal({ children, className, delay = 0, stagger, style }: RevealProps) {
  if (stagger != null && Children.count(children) > 1) {
    return (
      <div className={classNames(styles.revealStagger, className)} style={style}>
        {Children.map(children, (child, index) => (
          <div
            key={index}
            className={styles.staggerItem}
            style={{ animationDelay: `${delay + index * stagger}ms` }}
          >
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={classNames(styles.reveal, className)}
      style={{ ...style, animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export {
  Reveal,
}
