import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { screen } from '@testing-library/react'
import { Footer } from './Footer'
import { renderWithProviders } from '@/test/test-utils'
import { SITE_VERSION } from '@/constants'

describe('Footer', () => {
  it('renders email link', () => {
    renderWithProviders(createElement(Footer))
    expect(screen.getByRole('link', { name: /info@nagaevomaster.ru/i })).toHaveAttribute(
      'href',
      'mailto:info@nagaevomaster.ru',
    )
  })

  it('renders site version and update date', () => {
    renderWithProviders(createElement(Footer))
    expect(screen.getByText(new RegExp(`Сайт v${SITE_VERSION.replace(/\./g, '\\.')}`))).toBeInTheDocument()
    expect(screen.getByText(/обновлено/i)).toBeInTheDocument()
  })

  it('renders legal notice', () => {
    renderWithProviders(createElement(Footer))
    expect(screen.getByText(/Все права защищены/i)).toBeInTheDocument()
    expect(screen.getByText(/Товарный знак «Нагаево Мастер»/i)).toBeInTheDocument()
  })
})
