import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeeBreakdown } from '../src/components/gig/FeeBreakdown'

describe('<FeeBreakdown />', () => {
  it('shows the customer the job price, the admin fee from the worker’s pay and what the worker receives', () => {
    render(<FeeBreakdown payoutCents={50_000} perspective="customer" />)
    expect(screen.getByText('R500')).toBeInTheDocument()
    expect(screen.getByText('R75')).toBeInTheDocument()
    expect(screen.getByText('R425')).toBeInTheDocument()
    expect(screen.getByText(/from the worker’s pay/)).toBeInTheDocument()
  })
  it('tells the worker exactly what they receive', () => {
    render(<FeeBreakdown payoutCents={50_000} perspective="worker" />)
    expect(screen.getByText('You receive')).toBeInTheDocument()
    expect(screen.getByText('R425')).toBeInTheDocument()
    expect(screen.getByText(/The job pays R500/)).toBeInTheDocument()
  })
})
