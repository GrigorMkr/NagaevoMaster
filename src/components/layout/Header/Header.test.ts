import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { screen } from '@testing-library/react'
import { Header } from './Header'
import { renderWithProviders } from '@/test/test-utils'

describe('Header', () => {
  it('renders navigation links', () => {
    renderWithProviders(createElement(Header))
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
