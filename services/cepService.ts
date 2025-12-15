export interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export const fetchAddressByCep = async (cep: string): Promise<CepData> => {
  // Remove non-digits
  const cleanCep = cep.replace(/\D/g, '');

  if (cleanCep.length !== 8) {
    throw new Error('CEP inválido.');
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado.');
    }

    // Restriction Logic
    if (data.localidade !== 'Campo Largo') {
      throw new Error(`Cadastro restrito. Atendemos apenas Campo Largo/PR. (Seu CEP é de: ${data.localidade})`);
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao buscar CEP.');
  }
};