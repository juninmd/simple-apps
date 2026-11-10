import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def generate_validation_pdf(data: dict) -> bytes:
    """
    Generates a PDF 'Proof of Validation' card for CNPJ lookup results.

    :param data: Dictionary containing CNPJ details.
        Expected keys: cnpj, razao_social, nome_fantasia, status,
                       data_abertura, cnae_principal, endereco, data_consulta
    :return: Bytes of the generated PDF file.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Define custom styles
    title_style = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1A365D')
    )

    subtitle_style = ParagraphStyle(
        'HeaderSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4A5568')
    )

    label_style = ParagraphStyle(
        'LabelStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#2D3748')
    )

    value_style = ParagraphStyle(
        'ValueStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#1A202C')
    )

    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10,
        alignment=1, # Center
        textColor=colors.HexColor('#718096')
    )

    elements = []

    # Title & Subtitle
    elements.append(Paragraph("Comprovante de Validação de CNPJ", title_style))
    elements.append(Paragraph("Cartão de Prova de Validação Cadastral - Receita Federal / CNPJ Bot", subtitle_style))
    elements.append(Spacer(1, 12))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2B6CB0'), spaceAfter=15))

    # Formatted Fields
    cnpj_val = data.get('cnpj', 'N/A')
    razao_val = data.get('razao_social', 'N/A')
    fantasia_val = data.get('nome_fantasia', 'N/A')
    status_val = data.get('status', 'ATIVO').upper()
    abertura_val = data.get('data_abertura', 'N/A')
    cnae_val = data.get('cnae_principal', 'N/A')
    endereco_val = data.get('endereco', 'N/A')
    consulta_val = data.get('data_consulta', datetime.now().strftime("%d/%m/%Y %H:%M:%S"))

    table_data = [
        [
            Paragraph("CNPJ:", label_style),
            Paragraph(str(cnpj_val), value_style),
            Paragraph("Situação Cadastral:", label_style),
            Paragraph(f"<b>{status_val}</b>", value_style)
        ],
        [
            Paragraph("Razão Social:", label_style),
            Paragraph(str(razao_val), value_style),
            Paragraph("Data de Abertura:", label_style),
            Paragraph(str(abertura_val), value_style)
        ],
        [
            Paragraph("Nome Fantasia:", label_style),
            Paragraph(str(fantasia_val), value_style),
            Paragraph("Data da Consulta:", label_style),
            Paragraph(str(consulta_val), value_style)
        ],
        [
            Paragraph("CNAE Principal:", label_style),
            Paragraph(str(cnae_val), value_style),
            "", ""
        ],
        [
            Paragraph("Endereço:", label_style),
            Paragraph(str(endereco_val), value_style),
            "", ""
        ]
    ]

    # Table styling & layout
    t = Table(table_data, colWidths=[1.3*inch, 2.5*inch, 1.3*inch, 2.1*inch])
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('SPAN', (1, 3), (3, 3)), # Span CNAE value across columns
        ('SPAN', (1, 4), (3, 4)), # Span Endereco value across columns
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F7FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#EDF2F7')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))

    elements.append(t)
    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E0'), spaceAfter=10))

    # Footer note
    elements.append(Paragraph("Este documento é um comprovante gerado automaticamente pelo CNPJ Validation Bot.", footer_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
