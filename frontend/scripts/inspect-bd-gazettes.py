"""Render the first page of geography source gazettes for visual verification."""
from pathlib import Path
from urllib.request import urlopen
import pypdfium2 as pdfium

sources = {
    "matamuhuri": "61700_42685",
    "bangra": "62253_57891",
    "dakshin-gafargaon": "62254_51393",
    "fatikchhari-uttar": "62255_91602",
}
output = Path(__file__).resolve().parents[2] / "tmp" / "pdfs" / "geography"
output.mkdir(parents=True, exist_ok=True)
for name, gazette in sources.items():
    with urlopen(f"https://www.dpp.gov.bd/upload_file/gazettes/{gazette}.pdf", timeout=30) as response:
        pdf = pdfium.PdfDocument(response.read())
    page = pdf[0]
    target = output / f"{name}.png"
    page.render(scale=1.5).to_pil().save(target)
    print(target)
    page.close()
    pdf.close()
