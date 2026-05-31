import type { Ticket, TicketInput } from '../../types/ticket'

export interface TicketProvider {
  fetchTickets(): Promise<Ticket[]>
  fetchTicketById(id: string): Promise<Ticket | null>
  createTicket(ticket: TicketInput): Promise<Ticket>
  updateTicket(id: string, updates: Partial<TicketInput>): Promise<Ticket>
  deleteTicket(id: string): Promise<void>
}
