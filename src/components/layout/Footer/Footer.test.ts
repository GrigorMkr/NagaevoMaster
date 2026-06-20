import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { screen } from '@testing-library/react'
import { Footer } from './Footer'
import { renderWithProviders } from '@/test/test-utils'

describe('Footer', () => {
  it('renders email link', () => {
    renderWithProviders(createElement(Footer))
    expect(screen.getByRole('link', { name: /info@nagaevomaster.ru/i })).toHaveAttribute(
      'href',
      'mailto:info@nagaevomaster.ru',
    )
  })
})
