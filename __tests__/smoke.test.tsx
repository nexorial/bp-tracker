import { render, screen } from '@testing-library/react'
import Home from '../app/page'

describe('Project Setup Smoke Tests', () => {
  it('renders the BP Tracker homepage', () => {
    render(<Home />)
    expect(screen.getByTestId('app-title')).toHaveTextContent('BP Tracker')
    expect(screen.getByTestId('app-description')).toBeInTheDocument()
  })

  it('has Tailwind CSS classes applied to main element', () => {
    render(<Home />)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('min-h-screen')
    expect(main).toHaveClass('bg-gray-50')
  })

  it('displays the dashboard sections', () => {
    render(<Home />)
    expect(screen.getByTestId('chart-section')).toBeInTheDocument()
    expect(screen.getByTestId('input-section')).toBeInTheDocument()
    expect(screen.getByTestId('list-section')).toBeInTheDocument()
  })
})
