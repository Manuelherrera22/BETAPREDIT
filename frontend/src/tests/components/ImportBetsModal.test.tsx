/**
 * Import Bets Modal Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ImportBetsModal from '../../components/ImportBetsModal';
import * as externalBetsService from '../../services/externalBetsService';
import * as csvImport from '../../utils/csvImport';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('../../services/externalBetsService');
vi.mock('../../utils/csvImport');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ImportBetsModal', () => {
  let queryClient: QueryClient;
  const mockOnClose = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
      },
    });
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ImportBetsModal isOpen={false} onClose={mockOnClose} />
      </QueryClientProvider>
    );

    expect(screen.queryByText(/Importar Apuestas/i)).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ImportBetsModal isOpen={true} onClose={mockOnClose} />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Importar Apuestas/i)).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    const mockCsvText = 'platform,stake,odds\nBet365,100,2.0';
    const mockParsed = [{ platform: 'Bet365', stake: 100, odds: 2.0 }];
    const mockValidated = {
      valid: true,
      data: { platform: 'Bet365', stake: 100, odds: 2.0 },
      errors: [],
    };

    (csvImport.readCSVFile as any).mockResolvedValue(mockCsvText);
    (csvImport.parseCSV as any).mockReturnValue(mockParsed);
    (csvImport.validateAndNormalizeBetRow as any).mockReturnValue(mockValidated);

    render(
      <QueryClientProvider client={queryClient}>
        <ImportBetsModal isOpen={true} onClose={mockOnClose} />
      </QueryClientProvider>
    );

    const fileInput = screen.getByLabelText(/Seleccionar archivo/i) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(csvImport.readCSVFile).toHaveBeenCalled();
    });
  });

  it('should reject non-CSV files', async () => {
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    render(
      <QueryClientProvider client={queryClient}>
        <ImportBetsModal isOpen={true} onClose={mockOnClose} />
      </QueryClientProvider>
    );

    const fileInput = screen.getByLabelText(/Seleccionar archivo/i) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('CSV'));
    });
  });

  it('should import valid bets', async () => {
    const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    const mockCsvText = 'platform,stake,odds\nBet365,100,2.0';
    const mockParsed = [{ platform: 'Bet365', stake: 100, odds: 2.0 }];
    const mockValidated = {
      valid: true,
      data: { platform: 'Bet365', stake: 100, odds: 2.0 },
      errors: [],
    };

    (csvImport.readCSVFile as any).mockResolvedValue(mockCsvText);
    (csvImport.parseCSV as any).mockReturnValue(mockParsed);
    (csvImport.validateAndNormalizeBetRow as any).mockReturnValue(mockValidated);
    (externalBetsService.externalBetsService.registerBet as any).mockResolvedValue({ id: 'bet-1' });

    render(
      <QueryClientProvider client={queryClient}>
        <ImportBetsModal isOpen={true} onClose={mockOnClose} />
      </QueryClientProvider>
    );

    const fileInput = screen.getByLabelText(/Seleccionar archivo/i) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      const importButton = screen.getByText(/Importar/i);
      fireEvent.click(importButton);
    });

    await waitFor(() => {
      expect(externalBetsService.externalBetsService.registerBet).toHaveBeenCalled();
    });
  });
});

