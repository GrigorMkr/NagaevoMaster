import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { screen } from '@testing-library/react'
import { SearchPage } from './SearchPage'
import { renderWithProviders } from '@/test/test-utils'

describe('SearchPage', () => {
  it('renders search form and filters', () => {
    renderWithProviders(createElement(SearchPage))
    expect(screen.getByRole('heading', { name: 'Найти услугу' })).toBeInTheDocument()
    expect(screen.getByLabelText('Поиск услуг')).toBeInTheDocument()
    expect(screen.getByLabelText('Минимальный рейтинг')).toBeInTheDocument()
  })
})
