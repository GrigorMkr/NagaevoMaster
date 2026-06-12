import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { screen } from '@testing-library/react'
import { Button } from './Button'
import { renderWithProviders } from '@/test/test-utils'

describe('Button', () => {
  it('renders children', () => {
    renderWithProviders(createElement(Button, { type: 'button' }, 'Найти'))
    expect(screen.getByRole('button', { name: 'Найти' })).toBeInTheDocument()
  })

  it('supports submit type', () => {
    renderWithProviders(createElement(Button, { type: 'submit' }, 'Отправить'))
    expect(screen.getByRole('button', { name: 'Отправить' })).toHaveAttribute('type', 'submit')
  })
})
