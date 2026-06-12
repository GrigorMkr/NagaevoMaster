import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { screen } from '@testing-library/react'
import { ContactPage } from './ContactPage'
import { renderWithProviders } from '@/test/test-utils'

describe('ContactPage', () => {
  it('renders contact form with labels', () => {
    renderWithProviders(createElement(ContactPage))
    expect(screen.getByLabelText('Имя')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Сообщение')).toBeInTheDocument()
  })
})
