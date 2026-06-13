import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { screen } from '@testing-library/react'
import { Logo } from './Logo'
import { renderWithProviders } from '@/test/test-utils'

describe('Logo', () => {
  it('renders stamp wordmark by default', () => {
    renderWithProviders(createElement(Logo))
    expect(screen.getByLabelText('Нагаево Мастер')).toBeInTheDocument()
    expect(screen.getByText('Нагаево')).toBeInTheDocument()
    expect(screen.getByText('Мастер')).toBeInTheDocument()
  })

  it('renders accessible icon variant', () => {
    renderWithProviders(createElement(Logo, { variant: 'icon' }))
    expect(screen.getByLabelText('Нагаево Мастер')).toBeInTheDocument()
  })
})
