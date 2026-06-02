import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('InsightsFilter', () => {
  it('renders all filter options including "Todos"', async () => {
    const { InsightsFilter } = await import('./InsightsFilter');
    render(<InsightsFilter value="todos" onChange={() => {}} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    const optionTexts = options.map((o) => (o as HTMLOptionElement).textContent);

    expect(optionTexts).toContain('Todos');
    expect(optionTexts).toContain('El Confiado');
    expect(optionTexts).toContain('El Resiliente');
    expect(optionTexts).toContain('Montaña Rusa');
    expect(optionTexts).toContain('Radar');
  });

  it('has "Todos" selected by default when value is "todos"', async () => {
    const { InsightsFilter } = await import('./InsightsFilter');
    render(<InsightsFilter value="todos" onChange={() => {}} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('todos');
  });

  it('selects the correct archetype when value is set', async () => {
    const { InsightsFilter } = await import('./InsightsFilter');
    render(<InsightsFilter value="confiado" onChange={() => {}} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('confiado');
  });

  it('calls onChange with the selected value when user changes option', async () => {
    const handleChange = vi.fn();
    const { InsightsFilter } = await import('./InsightsFilter');
    render(<InsightsFilter value="todos" onChange={handleChange} />);

    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'resiliente');

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('resiliente');
  });

  it('calls onChange with "todos" when selecting Todos', async () => {
    const handleChange = vi.fn();
    const { InsightsFilter } = await import('./InsightsFilter');
    render(<InsightsFilter value="confiado" onChange={handleChange} />);

    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'todos');

    expect(handleChange).toHaveBeenCalledWith('todos');
  });

  it('has all 5 options (Todos + 4 archetypes)', async () => {
    const { InsightsFilter } = await import('./InsightsFilter');
    render(<InsightsFilter value="todos" onChange={() => {}} />);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(5);
  });
});
