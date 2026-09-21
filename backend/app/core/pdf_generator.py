"""
=====================================================================
ARIX BACKEND - Generador de PDFs de factura
=====================================================================
Genera facturas en PDF (por tienda o consolidadas) usando reportlab,
con un diseño simple, limpio y profesional acorde a la identidad
visual de ARIX (tonos neutros, tipografía clara).
=====================================================================
"""

from datetime import datetime
from decimal import Decimal
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet

from app.core.config import settings

# Paleta ARIX
COLOR_BLACK = colors.HexColor("#1D1D1F")
COLOR_GRAY_MEDIUM = colors.HexColor("#86868B")
COLOR_GRAY_LIGHT = colors.HexColor("#F5F5F7")
COLOR_WHITE = colors.HexColor("#FFFFFF")

# Logo de ARIX (usado en el encabezado de cada factura)
LOGO_PATH = Path(__file__).resolve().parent.parent / "static" / "assets" / "arix-logo.png"


class InvoiceLineItem:
    """Estructura simple para una línea de producto en la factura."""

    def __init__(self, product_name: str, quantity: int, unit_price: Decimal, line_total: Decimal):
        self.product_name = product_name
        self.quantity = quantity
        self.unit_price = unit_price
        self.line_total = line_total


class InvoiceStoreSection:
    """Sección de una tienda dentro de la factura (usado en facturas consolidadas)."""

    def __init__(self, store_name: str, sub_order_number: str, items: list[InvoiceLineItem], subtotal: Decimal, tax_amount: Decimal, total: Decimal):
        self.store_name = store_name
        self.sub_order_number = sub_order_number
        self.items = items
        self.subtotal = subtotal
        self.tax_amount = tax_amount
        self.total = total


def _money(value: Decimal) -> str:
    return f"L. {value:,.2f}"


def _build_styles():
    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="ArixTitle",
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=COLOR_BLACK,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ArixSubtitle",
            fontName="Helvetica",
            fontSize=9,
            leading=14,
            textColor=COLOR_GRAY_MEDIUM,
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ArixSectionTitle",
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=COLOR_BLACK,
            spaceBefore=14,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ArixBody",
            fontName="Helvetica",
            fontSize=9,
            textColor=COLOR_BLACK,
            leading=14,
        )
    )
    return styles


def _items_table(items: list[InvoiceLineItem]) -> Table:
    data = [["Producto", "Cantidad", "Precio unitario", "Subtotal"]]
    for item in items:
        data.append([
            item.product_name,
            str(item.quantity),
            _money(item.unit_price),
            _money(item.line_total),
        ])

    table = Table(data, colWidths=[80 * mm, 25 * mm, 35 * mm, 35 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_GRAY_LIGHT),
                ("TEXTCOLOR", (0, 0), (-1, 0), COLOR_BLACK),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                ("TOPPADDING", (0, 1), (-1, -1), 6),
                ("LINEBELOW", (0, 0), (-1, 0), 0.5, COLOR_GRAY_MEDIUM),
                ("LINEBELOW", (0, -1), (-1, -1), 0.5, COLOR_GRAY_LIGHT),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_WHITE, COLOR_GRAY_LIGHT]),
            ]
        )
    )
    return table


def _totals_table(subtotal: Decimal, tax_amount: Decimal, total: Decimal) -> Table:
    data = [
        ["Subtotal", _money(subtotal)],
        ["Impuestos (15%)", _money(tax_amount)],
        ["Total", _money(total)],
    ]
    table = Table(data, colWidths=[140 * mm, 35 * mm])
    table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, 1), "Helvetica"),
                ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
                ("TEXTCOLOR", (0, 0), (-1, 1), COLOR_GRAY_MEDIUM),
                ("TEXTCOLOR", (0, 2), (-1, 2), COLOR_BLACK),
                ("LINEABOVE", (0, 2), (-1, 2), 0.75, COLOR_BLACK),
                ("TOPPADDING", (0, 2), (-1, 2), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table


def _header_block(styles, invoice_number: str, issued_at: datetime, order_number: str) -> list:
    """
    Construye el encabezado de la factura: logo de ARIX a la izquierda
    y los datos de la factura (número, orden, fecha) a la derecha.
    """
    info_paragraphs = [
        Paragraph("ARIX", styles["ArixTitle"]),
        Paragraph("Plataforma SaaS Marketplace Multi-Tienda", styles["ArixSubtitle"]),
        Paragraph(f"<b>Factura:</b> {invoice_number}", styles["ArixBody"]),
        Paragraph(f"<b>Orden:</b> {order_number}", styles["ArixBody"]),
        Paragraph(f"<b>Fecha de emisión:</b> {issued_at.strftime('%d/%m/%Y %H:%M')}", styles["ArixBody"]),
    ]

    if LOGO_PATH.exists():
        logo = Image(str(LOGO_PATH), width=22 * mm, height=22 * mm)
        header_table = Table(
            [[logo, info_paragraphs]],
            colWidths=[28 * mm, 152 * mm],
        )
        header_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ALIGN", (0, 0), (0, 0), "LEFT"),
                    ("LEFTPADDING", (0, 0), (0, 0), 0),
                    ("RIGHTPADDING", (0, 0), (0, 0), 0),
                ]
            )
        )
        elements = [header_table, Spacer(1, 12)]
    else:
        elements = info_paragraphs + [Spacer(1, 10)]

    return elements


def _customer_block(styles, customer_name: str, customer_email: str, shipping_address: str) -> list:
    return [
        Paragraph("Datos del cliente", styles["ArixSectionTitle"]),
        Paragraph(f"<b>Nombre:</b> {customer_name}", styles["ArixBody"]),
        Paragraph(f"<b>Correo:</b> {customer_email}", styles["ArixBody"]),
        Paragraph(f"<b>Dirección de envío:</b> {shipping_address}", styles["ArixBody"]),
    ]


def generate_store_invoice_pdf(
    invoice_number: str,
    order_number: str,
    issued_at: datetime,
    customer_name: str,
    customer_email: str,
    shipping_address: str,
    store_name: str,
    items: list[InvoiceLineItem],
    subtotal: Decimal,
    tax_amount: Decimal,
    total: Decimal,
    output_path: Path,
) -> Path:
    """Genera el PDF de una factura individual por tienda."""
    styles = _build_styles()
    doc = SimpleDocTemplate(str(output_path), pagesize=letter, topMargin=30 * mm, bottomMargin=20 * mm)

    elements: list = []
    elements.extend(_header_block(styles, invoice_number, issued_at, order_number))
    elements.extend(_customer_block(styles, customer_name, customer_email, shipping_address))

    elements.append(Paragraph(f"Tienda: {store_name}", styles["ArixSectionTitle"]))
    elements.append(_items_table(items))
    elements.append(Spacer(1, 10))
    elements.append(_totals_table(subtotal, tax_amount, total))

    doc.build(elements)
    return output_path


def generate_consolidated_invoice_pdf(
    invoice_number: str,
    order_number: str,
    issued_at: datetime,
    customer_name: str,
    customer_email: str,
    shipping_address: str,
    sections: list[InvoiceStoreSection],
    grand_subtotal: Decimal,
    grand_tax: Decimal,
    grand_total: Decimal,
    output_path: Path,
) -> Path:
    """Genera el PDF de la factura consolidada de toda la orden (todas las tiendas)."""
    styles = _build_styles()
    doc = SimpleDocTemplate(str(output_path), pagesize=letter, topMargin=30 * mm, bottomMargin=20 * mm)

    elements: list = []
    elements.extend(_header_block(styles, invoice_number, issued_at, order_number))
    elements.extend(_customer_block(styles, customer_name, customer_email, shipping_address))

    for section in sections:
        elements.append(
            Paragraph(f"Tienda: {section.store_name} — Suborden {section.sub_order_number}", styles["ArixSectionTitle"])
        )
        elements.append(_items_table(section.items))
        elements.append(Spacer(1, 6))
        elements.append(_totals_table(section.subtotal, section.tax_amount, section.total))
        elements.append(Spacer(1, 10))

    elements.append(Paragraph("Resumen general", styles["ArixSectionTitle"]))
    elements.append(_totals_table(grand_subtotal, grand_tax, grand_total))

    doc.build(elements)
    return output_path
