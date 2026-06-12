import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { screen } from '@testing-library/react'
import { HomePage } from './HomePage'
import { renderWithProviders } from '@/test/test-utils'

describe('HomePage', () => {
  it('renders hero heading', () => {
    renderWithProviders(createElement(HomePage))
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
