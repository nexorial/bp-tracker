import { render, screen } from '@testing-library/react'
import Home from '../app/page'

describe('Project Setup Smoke Tests', () => {
  it('renders the BP Tracker homepage', () => {
    render(<Home />)
    expect(screen.getByText('BP Tracker')).toBeInTheDocument()
    expect(screen.getByText('Blood Pressure Tracking App')).toBeInTheDocument()
  })

  it('has Tailwind CSS classes applied', () => {
    render(<Home />)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('min-h-screen')
  })

  it('displays the Tailwind test div with gradient', () => {
    render(<Home />)
    const tailwindTest = screen.getByTestId('tailwind-test')
    expect(tailwindTest).toBeInTheDocument()
    expect(tailwindTest).toHaveClass('bg-gradient-to-r')
  })
})
