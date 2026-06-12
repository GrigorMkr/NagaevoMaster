import styles from './PageHeader.module.css';
interface PageHeaderProps {
    title: string;
    subtitle?: string;
    badge?: string;
}
function PageHeader({ title, subtitle, badge }: PageHeaderProps) {
    return (<header className={styles.header}>
      {badge && <span className="badge">{badge}</span>}
      <h1 className="titlePage">{title}</h1>
      {subtitle && <p className="textMuted">{subtitle}</p>}
    </header>);
}

export {
  PageHeader,
}
