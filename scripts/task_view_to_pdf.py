import json
import sys
import tkinter as tk
from tkinter import filedialog
from weasyprint import HTML, CSS

def create_detailed_pdf(file_path, pdf_html, pdf_css):
    html = HTML(string=pdf_html)
    css = CSS(string=pdf_css)
    html.write_pdf(file_path, stylesheets=[css])

# Create the main window (it will not be displayed)
root = tk.Tk()
root.withdraw()  # Hide the main window

# Open the file dialog to choose the save location and filename
file_path = filedialog.asksaveasfilename(
    defaultextension=".pdf",
    filetypes=[("PDF files", "*.pdf")],
    title="Choose location to save the PDF"
)

# Check if the user provided a file path
if file_path:
    pdf_html = sys.argv[1]
    pdf_css = sys.argv[2]

    create_detailed_pdf(file_path, pdf_html, pdf_css)
