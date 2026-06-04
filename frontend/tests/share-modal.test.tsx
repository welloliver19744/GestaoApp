import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareModal } from '../src/components/transactions/ShareModal'

// Mock do pb client
const mockGetFullList = vi.fn()
vi.mock('../src/api/client', () => ({
  pb: {
    collection: () => ({
      getFullList: mockGetFullList,
    }),
    authStore: {
      record: { id: 'current-user-id' },
    },
  },
}))

const mockOnSave = vi.fn()
const mockOnClose = vi.fn()

const defaultUsers = [
  { id: 'user-a', email: 'userA@test.com', name: 'User A', avatar: '' },
  { id: 'user-b', email: 'userB@test.com', name: 'User B', avatar: '' },
]

describe('ShareModal', () => {
  beforeEach(() => {
    mockGetFullList.mockResolvedValue(defaultUsers)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders when open is true', async () => {
    render(
      <ShareModal
        open={true}
        onClose={mockOnClose}
        currentSharedWith={[]}
        onSave={mockOnSave}
      />
    )
    expect(screen.getByText('Compartilhar Transação')).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    const { container } = render(
      <ShareModal
        open={false}
        onClose={mockOnClose}
        currentSharedWith={[]}
        onSave={mockOnSave}
      />
    )
    expect(container.textContent).not.toContain('Compartilhar Transação')
  })

  it('loads and displays users', async () => {
    render(
      <ShareModal
        open={true}
        onClose={mockOnClose}
        currentSharedWith={[]}
        onSave={mockOnSave}
      />
    )
    expect(await screen.findByText('userA@test.com')).toBeInTheDocument()
    expect(screen.getByText('userB@test.com')).toBeInTheDocument()
  })

  it('pre-selects users from currentSharedWith', async () => {
    render(
      <ShareModal
        open={true}
        onClose={mockOnClose}
        currentSharedWith={['user-a']}
        onSave={mockOnSave}
      />
    )
    // User A should appear as selected (highlighted)
    const btnA = await screen.findByText('userA@test.com')
    expect(btnA.closest('button')?.className).toContain('neon-cyan')
  })

  it('calls onSave with selected users', async () => {
    const user = userEvent.setup()
    render(
      <ShareModal
        open={true}
        onClose={mockOnClose}
        currentSharedWith={[]}
        onSave={mockOnSave}
      />
    )
    // Wait for users to load
    await screen.findByText('userA@test.com')

    // Click on user A
    await user.click(screen.getByText('userA@test.com'))

    // Click Save
    await user.click(screen.getByText('Salvar'))

    expect(mockOnSave).toHaveBeenCalledWith(['user-a'])
  })

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    render(
      <ShareModal
        open={true}
        onClose={mockOnClose}
        currentSharedWith={[]}
        onSave={mockOnSave}
      />
    )
    await screen.findByText('userA@test.com')
    await user.click(screen.getByText('Cancelar'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('shows message when no other users exist', async () => {
    mockGetFullList.mockResolvedValue([])
    render(
      <ShareModal
        open={true}
        onClose={mockOnClose}
        currentSharedWith={[]}
        onSave={mockOnSave}
      />
    )
    expect(await screen.findByText('Nenhum outro usuário cadastrado.')).toBeInTheDocument()
  })
})
