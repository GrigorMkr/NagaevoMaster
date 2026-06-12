import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { screen } from '@testing-library/react'
import { AuthPage } from './AuthPage'
import { renderWithProviders } from '@/test/test-utils'

describe('AuthPage', () => {
  it('renders auth tabs', () => {
    renderWithProviders(createElement(AuthPage))
    expect(screen.getByRole('tab', { name: 'Вход' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Регистрация' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Восстановление' })).toBeInTheDocument()
  })

  it('renders login form with action', () => {
    renderWithProviders(createElement(AuthPage))
    const form = document.querySelector('form[action="https://echo.htmlacademy.ru"]')
    expect(form).toBeTruthy()
  })
})
