import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToastProvider, useToast } from '../src/components/ui/Toast'
import { act } from 'react'

function TestConsumer() {
  const { toast } = useToast()
  return <button onClick={() => toast('Test message', 'success')}>Show Toast</button>
}

describe('ToastProvider', () => {
  it('renders children', () => {
    render(<ToastProvider><div>App content</div></ToastProvider>)
    expect(screen.getByText('App content')).toBeInTheDocument()
  })

  it('shows toast when triggered', () => {
    render(<ToastProvider><TestConsumer /></ToastProvider>)
    act(() => { screen.getByText('Show Toast').click() })
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('shows error toast with correct styling class', () => {
    function ErrorConsumer() {
      const { toast } = useToast()
      return <button onClick={() => toast('Error!', 'error')}>Trigger Error</button>
    }
    render(<ToastProvider><ErrorConsumer /></ToastProvider>)
    act(() => { screen.getByText('Trigger Error').click() })
    const toastEl = screen.getByText('Error!')
    expect(toastEl).toBeInTheDocument()
    expect(toastEl.className).toContain('neon-red')
  })
})
