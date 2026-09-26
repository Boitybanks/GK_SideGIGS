import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeeBreakdown } from '../src/components/gig/FeeBreakdown'

describe('<FeeBreakdown />', () => {
  it('shows the customer the full breakdown', () => {
    render(<FeeBreakdown payoutCents={50_000} perspective="customer" />)
    expect(screen.getByText('R500')).toBeInTheDocument()
    expect(screen.getByText('R75')).toBeInTheDocument()
    expect(screen.getByText('R575')).toBeInTheDocument()
  })
  it('tells the worker exactly what they earn', () => {
    render(<FeeBreakdown payoutCents={50_000} perspective="worker" />)
    expect(screen.getByText('You earn')).toBeInTheDocument()
    expect(screen.getByText('R500')).toBeInTheDocument()
    expect(screen.queryByText('R575')).not.toBeInTheDocument()
  })
})
