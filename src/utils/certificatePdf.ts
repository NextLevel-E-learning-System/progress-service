// @ts-expect-error - tipos não instalados neste momento
import PDFDocument from 'pdfkit';
// @ts-expect-error - tipos não instalados neste momento
import QRCode from 'qrcode';
import { createHash } from 'crypto';

interface PdfOptions { tituloCurso:string; nomeUsuario:string; codigoCertificado:string; hashValidacao:string; empresa?:string; instrutor?:string; assinaturaInstrutor?:string; }

export async function gerarPdfCertificado(opts: PdfOptions): Promise<Buffer>{
  const doc = new PDFDocument({ size:'A4', margin:50 });
  const chunks: Buffer[] = [];
  doc.on('data', (d: Buffer)=>chunks.push(d));
  const qrData = `https://validar.example.com/cert/${opts.codigoCertificado}?hash=${opts.hashValidacao}`;
  const qrPng = await QRCode.toBuffer(qrData, { margin:1, scale:4 });
  // Cabeçalho
  doc.fontSize(22).text(opts.empresa || 'NextLevel E-learning', { align:'center' });
  doc.moveDown();
  doc.fontSize(16).text('CERTIFICADO DE CONCLUSÃO', { align:'center' });
  doc.moveDown(2);
  doc.fontSize(12).text(`Certificamos que ${opts.nomeUsuario} concluiu com êxito o curso:`);
  doc.moveDown();
  doc.fontSize(18).text(opts.tituloCurso, { align:'center' });
  doc.moveDown(2);
  doc.fontSize(11).text(`Código do Certificado: ${opts.codigoCertificado}`);
  doc.text(`Hash de Validação: ${opts.hashValidacao.slice(0,16)}...`);
  doc.moveDown();
  // QR Code
  doc.image(qrPng, doc.page.width - 160, 120, { width:110 });
  // Assinaturas
  const assinatura = opts.assinaturaInstrutor || gerarAssinaturaFake(opts.instrutor || 'Instrutor Responsável');
  doc.moveDown(6);
  doc.fontSize(10).text('Assinado digitalmente por:', { align:'left' });
  doc.fontSize(12).text(assinatura, { align:'left' });
  doc.fontSize(9).text('Assinatura eletrônica gerada via hash SHA-256', { align:'left' });
  doc.end();
  await new Promise(r=>doc.on('end', r));
  return Buffer.concat(chunks);
}

function gerarAssinaturaFake(nome:string){
  const hash = createHash('sha256').update(nome).digest('hex').slice(0,12);
  return `${nome} / ${hash}`;
}