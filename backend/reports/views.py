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
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from io import BytesIO


class PDFReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _build_category_chart(self, category_rows):
        drawing = Drawing(460, 220)
        chart = VerticalBarChart()
        chart.x = 50
        chart.y = 40
        chart.height = 140
        chart.width = 360

        top_rows = list(category_rows)[:6]
        values = [float(row['total']) for row in top_rows] if top_rows else [0]
        labels = [str(row['category'])[:12] for row in top_rows] if top_rows else ['No Data']

        chart.data = [values]
        chart.categoryAxis.categoryNames = labels
        chart.valueAxis.valueMin = 0
        chart.bars[0].fillColor = colors.HexColor('#10b981')
        chart.barWidth = 18
        chart.groupSpacing = 10
        chart.barSpacing = 6

        drawing.add(chart)
        return drawing

    def get(self, request, *args, **kwargs):
        user = request.user
        # Default to current month
        try:
            year = int(request.query_params.get('year', date.today().year))
            month = int(request.query_params.get('month', date.today().month))
        except ValueError:
            return Response({'error': 'Invalid year or month format.'}, status=400)

        if month < 1 or month > 12:
            return Response({'error': 'Month must be between 1 and 12.'}, status=400)

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
        cat_list = list(cat_data)

        highest_category = cat_list[0]['category'] if cat_list else 'N/A'
        highest_amount = float(cat_list[0]['total']) if cat_list else 0.0
        non_essential_total = sum(float(row['total']) for row in cat_list if row['category'] in {'Shopping', 'Entertainment', 'Other'})
        non_essential_ratio = (non_essential_total / float(total_expense) * 100) if total_expense else 0

        # Build PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle('title', parent=styles['Title'], fontSize=20, textColor=colors.HexColor('#10b981'))
        story.append(Paragraph("Kharchi - Monthly Report", title_style))
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

        # Category Chart
        story.append(Paragraph("Category Chart", styles['Heading2']))
        story.append(Spacer(1, 0.2 * cm))
        story.append(self._build_category_chart(cat_list))
        story.append(Spacer(1, 0.6 * cm))

        # Category Breakdown
        story.append(Paragraph("Category Breakdown", styles['Heading2']))
        story.append(Spacer(1, 0.3 * cm))
        cat_table_data = [['Category', 'Amount (NPR)']]
        for row in cat_list:
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

        # Insights
        story.append(Spacer(1, 0.6 * cm))
        story.append(Paragraph("Insights", styles['Heading2']))
        story.append(Spacer(1, 0.2 * cm))
        story.append(Paragraph(f"Top expense category: {highest_category} (NPR {highest_amount:,.2f})", styles['Normal']))
        story.append(Paragraph(f"Non-essential spending ratio: {non_essential_ratio:.1f}%", styles['Normal']))
        if savings < 0:
            story.append(Paragraph("Spending exceeded income this month. Consider tightening variable expenses.", styles['Normal']))
        else:
            story.append(Paragraph("Positive savings this month. Keep momentum by capping non-essential spend.", styles['Normal']))

        doc.build(story)
        buffer.seek(0)

        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="kharchi_report_{year}_{month:02d}.pdf"'
        return response
