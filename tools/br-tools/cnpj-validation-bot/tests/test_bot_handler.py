import pytest
from unittest.mock import AsyncMock, MagicMock
from src.bot_handler import send_cnpj_pdf_handler


@pytest.mark.asyncio
async def test_send_cnpj_pdf_handler():
    mock_update = MagicMock()
    mock_message = AsyncMock()
    mock_update.effective_message = mock_message
    mock_update.message = mock_message

    mock_context = MagicMock()

    sample_data = {
        'cnpj': '00.000.000/0001-91',
        'razao_social': 'EMPRESA TESTE LTDA',
        'status': 'ATIVA'
    }

    await send_cnpj_pdf_handler(mock_update, mock_context, sample_data)

    mock_message.reply_document.assert_called_once()
    call_kwargs = mock_message.reply_document.call_args.kwargs

    assert call_kwargs['filename'] == 'comprovante_cnpj_00000000000191.pdf'
    assert 'EMPRESA TESTE LTDA' in call_kwargs['caption']
    assert call_kwargs['parse_mode'] == 'Markdown'

    # Check that document is a file-like object containing PDF header
    doc = call_kwargs['document']
    doc_content = doc.getvalue()
    assert doc_content.startswith(b'%PDF-')
