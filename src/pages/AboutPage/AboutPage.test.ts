import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { screen } from '@testing-library/react'
import { AboutPage } from './AboutPage'
import { renderWithProviders } from '@/test/test-utils'

describe('AboutPage', () => {
  it('renders mission and moderation sections', () => {
    renderWithProviders(createElement(AboutPage))
    expect(screen.getByRole('heading', { name: /Нагаево Мастер/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Модерация' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Правила платформы' })).toBeInTheDocument()
  })
})
