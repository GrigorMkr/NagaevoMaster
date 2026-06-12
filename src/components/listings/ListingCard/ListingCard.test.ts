import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { screen } from '@testing-library/react'
import { ListingCard } from './ListingCard'
import { renderWithProviders } from '@/test/test-utils'
import { mockListing } from '@/test/mock-data'

describe('ListingCard', () => {
  it('renders listing title', () => {
    renderWithProviders(createElement(ListingCard, { listing: mockListing }))
    expect(screen.getByText(mockListing.title)).toBeInTheDocument()
  })
})
