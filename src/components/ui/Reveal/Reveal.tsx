import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (stagger != null && Children.count(children) > 1) {
    return (
      <div
        ref={ref}
        className={classNames(styles.revealStagger, visible && styles.visible, className)}
        style={style}
      >
        {Children.map(children, (child, index) => (
          <div
            key={index}
            className={styles.staggerItem}
            style={{ transitionDelay: `${delay + index * stagger}ms` }}
          >
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={classNames(styles.reveal, visible && styles.visible, className)}
      style={{ ...style, transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export {
  Reveal,
}
