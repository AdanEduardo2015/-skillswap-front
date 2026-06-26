import { describe, it, expect, vi, type Mocked } from 'vitest';
import { api } from '../services/api';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as Mocked<typeof axios>;

describe('Frontend API Service', () => {
  it('should map publications to camelCase correctly', async () => {
    const rawData = {
      items: [{ Id_publicacion: '123', Contenido: 'Hola' }],
      nextToken: 'abc'
    };

    mockedAxios.get.mockResolvedValue({ data: rawData });

    const response = await api.publications.list(10);
    
    expect(response.items[0].id).toBe('123');
    expect(response.items[0].content).toBe('Hola');
    expect(response.hasMore).toBe(true);
  });
});
