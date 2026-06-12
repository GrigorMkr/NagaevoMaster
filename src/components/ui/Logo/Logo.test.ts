import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { screen } from '@testing-library/react'
import { Logo } from './Logo'
import { renderWithProviders } from '@/test/test-utils'

describe('Logo', () => {
  it('renders wordmark by default', () => {
    renderWithProviders(createElement(Logo))
    expect(screen.getByText('Nagaevo')).toBeInTheDocument()
    expect(screen.getByText('Master')).toBeInTheDocument()
  })

  it('renders accessible icon variant', () => {
    renderWithProviders(createElement(Logo, { variant: 'icon' }))
    expect(screen.getByLabelText('NagaevoMaster')).toBeInTheDocument()
  })
})
