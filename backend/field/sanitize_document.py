"""Flatten an untrusted PDF/JPG/PNG to a static image-only PDF. No originals retained."""
import sys,io,resource,warnings
resource.setrlimit(resource.RLIMIT_AS,(700*1024*1024,700*1024*1024));resource.setrlimit(resource.RLIMIT_CPU,(12,12))
import fitz
from PIL import Image
Image.MAX_IMAGE_PIXELS=20_000_000
warnings.simplefilter('error',Image.DecompressionBombWarning)
raw=sys.stdin.buffer.read(8*1024*1024+1)
if not raw or len(raw)>8*1024*1024:raise ValueError('Maximaal 8 MB.')
typ=sys.argv[1]
if typ=='application/pdf':
 if not raw.startswith(b'%PDF-'):raise ValueError('Ongeldige PDF.')
 doc=fitz.open(stream=raw,filetype='pdf')
 if doc.needs_pass or not 1<=len(doc)<=20:raise ValueError('PDF mag niet versleuteld zijn en maximaal 20 pagina’s bevatten.')
else:
 image=Image.open(io.BytesIO(raw));image.load()
 if image.format not in {'JPEG','PNG'} or typ not in {'image/png','image/jpeg'}:raise ValueError('Alleen PDF, JPG of PNG.')
 image=image.convert('RGB');image.thumbnail((2400,3400));buf=io.BytesIO();image.save(buf,format='PNG');doc=fitz.open(stream=buf.getvalue(),filetype='png');pdf=doc.convert_to_pdf();doc.close();doc=fitz.open(stream=pdf,filetype='pdf')
result=fitz.open()
for page in doc:
 if page.rect.width>2000 or page.rect.height>2000:raise ValueError('Pagina te groot.')
 pix=page.get_pixmap(matrix=fitz.Matrix(1.5,1.5),alpha=False)
 safe=result.new_page(width=page.rect.width,height=page.rect.height);safe.insert_image(safe.rect,stream=pix.tobytes('png'))
result.set_metadata({});out=result.tobytes(garbage=4,deflate=True,no_new_id=True)
if len(out)>8*1024*1024:raise ValueError('Document na veilige omzetting groter dan 8 MB.')
sys.stdout.buffer.write(out)
