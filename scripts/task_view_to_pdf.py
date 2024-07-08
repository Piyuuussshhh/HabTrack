import sys
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table

def create_pdf(input_data):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Title and content
    title = Paragraph("Dynamic Path PDF", styles["Title"])
    content = Paragraph("This PDF was generated dynamically with a user-selected path.", styles["BodyText"])
    spacer = Spacer(1, 20)
    
    # Define bullet points
    bullet_points = """
    <ul>
        <li>First item</li>
        <li>Second item</li>
        <li>Third item</li>
    </ul>
    """
    
    bullet_paragraph = Paragraph(bullet_points, styles["BodyText"])
    
    # Create and add other elements
    table_data = [["Header 1", "Header 2"], ["Row 1", "Row 2"]]
    table = Table(table_data)

    story = [title, spacer, content, spacer, bullet_paragraph, spacer, table]
    doc.build(story)
    
    buffer.seek(0)
    return buffer

if __name__ == "__main__":
    pdf_buffer = create_pdf(input_data="")
    
    # Save PDF to a file for simplicity; you can return it via other means if needed
    with open("output.pdf", "wb") as f:
        f.write(pdf_buffer.getvalue())
