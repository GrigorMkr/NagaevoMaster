import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { screen } from '@testing-library/react'
import { PageHeader } from './PageHeader'
import { renderWithProviders } from '@/test/test-utils'

describe('PageHeader', () => {
  it('renders title and badge', () => {
    renderWithProviders(
      createElement(PageHeader, { badge: 'Тест', title: 'Заголовок', subtitle: 'Подзаголовок' }),
    )
    expect(screen.getByText('Тест')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Заголовок' })).toBeInTheDocument()
  })
})
