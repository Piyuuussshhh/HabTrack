import json
import sys
import tkinter as tk
from tkinter import filedialog
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem, PageBreak

def data_handle(task):
    d = dict()
    for g,n in task:
        if g in d:
            d[g].append(n)

        else:
            d[g] = [n]

    return d

def fuck_rl(task_dict):
    all_task = ''''''


    for i, group_name in enumerate(task_dict.keys()):
        all_task += str(i+1) + '.' + '&nbsp;&nbsp;' + group_name + ':'

        for name in task_dict[group_name]:
            all_task += '<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + name

        all_task += '<br/><br/>'

    return all_task


def create_detailed_pdf(file_path, active_tasks, completed_tasks):
    doc = SimpleDocTemplate(file_path, pagesize=letter)
    styles = getSampleStyleSheet()
    bullet_style = styles["BodyText"]

    # Title and content
    title = Paragraph("Active Tasks", styles["Title"])
    spacer = Spacer(1, 20)

    active_dict = data_handle(active_tasks)
    completed_dict = data_handle(completed_tasks)
    
    # an,cn = len(active_dict), len(completed_dict)

    all_active_task = fuck_rl(active_dict)
    active_tasks_list = [Paragraph(all_active_task)]
    
    all_complete_task = fuck_rl(completed_dict) 
    completed_tasks_list = [Paragraph(all_complete_task)]

    # Build the PDF
    doc.build([
    title, spacer, spacer, *active_tasks_list, PageBreak(),
    Paragraph("Completed Tasks", styles['Title']), spacer, *completed_tasks_list, spacer
])

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
    active_tasks = json.loads(sys.argv[1])
    completed_tasks = json.loads(sys.argv[2])

    # active_tasks = [("Group 1", "Task 1"), ("Group 2", "Task 2"), ("Group 3", "Task 3")]
    # completed_tasks = [("Group 1", "Task 4"), ("Group 2", "Task 5")]


    create_detailed_pdf(file_path, active_tasks, completed_tasks)
    #print(f"PDF saved at: {file_path}")
#else:
    #print("Save operation was cancelled.")
