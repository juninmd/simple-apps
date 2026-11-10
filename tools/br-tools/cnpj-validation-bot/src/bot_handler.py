import io
from telegram import Update
from telegram.ext import ContextTypes
from src.pdf_generator import generate_validation_pdf


async def send_cnpj_pdf_handler(update: Update, context: ContextTypes.DEFAULT_TYPE, cnpj_data: dict) -> None:
    """
    Generates and sends the PDF 'Proof of Validation' card for a given CNPJ lookup result.

    :param update: Telegram Update object
    :param context: Telegram Context object
    :param cnpj_data: Lookup results dictionary
    """
    pdf_bytes = generate_validation_pdf(cnpj_data)
    cnpj = cnpj_data.get('cnpj', 'comprovante').replace('.', '').replace('/', '').replace('-', '')
    filename = f"comprovante_cnpj_{cnpj}.pdf"

    pdf_file = io.BytesIO(pdf_bytes)
    pdf_file.name = filename

    message = update.effective_message or update.message
    if message:
        await message.reply_document(
            document=pdf_file,
            filename=filename,
            caption=f"📄 *Comprovante de Validação de CNPJ*\nEmpresa: {cnpj_data.get('razao_social', 'N/A')}",
            parse_mode='Markdown'
        )
