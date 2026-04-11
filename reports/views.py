from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum
from django.http import HttpResponse
from transactions.models import Transaction
from datetime import date
import calendar
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from io import BytesIO


class PDFReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        # Default to current month
        year = int(request.query_params.get('year', date.today().year))
        month = int(request.query_params.get('month', date.today().month))

        start = date(year, month, 1)
        end = date(year, month, calendar.monthrange(year, month)[1])

        txns = Transaction.objects.filter(user=user, date__gte=start, date__lte=end)
        total_expense = txns.filter(transaction_type='DEBIT').aggregate(Sum('amount'))['amount__sum'] or 0
        total_income = txns.filter(transaction_type='CREDIT').aggregate(Sum('amount'))['amount__sum'] or 0
        savings = float(total_income) - float(total_expense)
        savings_rate = round((savings / float(total_income)) * 100, 1) if total_income else 0

        cat_data = (
            txns.filter(transaction_type='DEBIT')
            .values('category')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )

        # Build PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle('title', parent=styles['Title'], fontSize=20, textColor=colors.HexColor('#10b981'))
        story.append(Paragraph("NPR Finance — Monthly Report", title_style))
        story.append(Spacer(1, 0.3 * cm))
        story.append(Paragraph(f"User: {user.username}  |  Period: {start.strftime('%B %Y')}", styles['Normal']))
        story.append(Spacer(1, 0.5 * cm))

        # Summary Table
        summary_data = [
            ['Metric', 'Amount (NPR)'],
            ['Total Income', f"{float(total_income):,.2f}"],
            ['Total Expenses', f"{float(total_expense):,.2f}"],
            ['Net Savings', f"{savings:,.2f}"],
            ['Savings Rate', f"{savings_rate}%"],
        ]
        t = Table(summary_data, colWidths=[9 * cm, 7 * cm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')]),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.7 * cm))

        # Category Breakdown
        story.append(Paragraph("Category Breakdown", styles['Heading2']))
        story.append(Spacer(1, 0.3 * cm))
        cat_table_data = [['Category', 'Amount (NPR)']]
        for row in cat_data:
            cat_table_data.append([row['category'], f"{float(row['total']):,.2f}"])
        ct = Table(cat_table_data, colWidths=[9 * cm, 7 * cm])
        ct.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')]),
        ]))
        story.append(ct)

        doc.build(story)
        buffer.seek(0)

        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="finance_report_{year}_{month:02d}.pdf"'
        return response
