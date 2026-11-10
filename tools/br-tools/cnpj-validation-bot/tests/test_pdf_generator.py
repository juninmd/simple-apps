import pytest
from src.pdf_generator import generate_validation_pdf


def test_generate_validation_pdf_valid_data():
    sample_data = {
        'cnpj': '00.000.000/0001-91',
        'razao_social': 'EMPRESA TESTE LTDA',
        'nome_fantasia': 'EMPRESA TESTE',
        'status': 'ATIVA',
        'data_abertura': '01/01/2000',
        'cnae_principal': '6201-5/00 - Desenvolvimento de programas de computador sob encomenda',
        'endereco': 'RUA TESTE, 123, BAIRRO CENTRAL, SAO PAULO - SP, 01000-000',
        'data_consulta': '28/10/2026 12:00:00'
    }

    pdf_bytes = generate_validation_pdf(sample_data)

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0
    # PDF files start with %PDF- header
    assert pdf_bytes.startswith(b'%PDF-')


def test_generate_validation_pdf_missing_optional_fields():
    minimal_data = {
        'cnpj': '11.222.333/0001-44'
    }

    pdf_bytes = generate_validation_pdf(minimal_data)

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0
    assert pdf_bytes.startswith(b'%PDF-')
