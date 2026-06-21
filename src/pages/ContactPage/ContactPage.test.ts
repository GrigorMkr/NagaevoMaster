import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { screen } from '@testing-library/react'
import { ContactPage } from './ContactPage'
import { createTestStore, renderWithProviders } from '@/test/test-utils'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { render } from '@testing-library/react'
import { setUser } from '@/features/user/userSlice'

describe('ContactPage', () => {
  it('asks guests to sign in', () => {
    renderWithProviders(createElement(ContactPage))
    expect(screen.getByText(/войдите, чтобы написать нам/i)).toBeInTheDocument()
  })

  it('renders contact form for authenticated users', () => {
    const store = createTestStore()
    store.dispatch(setUser({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Иван',
      role: 'user',
      emailVerified: true,
      phoneVerified: false,
      createdAt: new Date().toISOString(),
    }))

    render(
      createElement(
        HelmetProvider,
        null,
        createElement(
          Provider,
          {
            store,
            children: createElement(MemoryRouter, null, createElement(ContactPage)),
          },
        ),
      ),
    )

    expect(screen.getByLabelText('Имя')).toHaveValue('Иван')
    expect(screen.getByLabelText('Email')).toHaveValue('user@example.com')
    expect(screen.getByLabelText('Имя')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Email')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Сообщение')).toBeInTheDocument()
  })
})
