// @ts-expect-error - tipos não instalados neste momento
import PDFDocument from 'pdfkit';
// @ts-expect-error - tipos não instalados neste momento
import QRCode from 'qrcode';

interface PdfOptions { 
  tituloCurso:string; 
  nomeUsuario:string; 
  codigoCertificado:string; 
  hashValidacao:string; 
  empresa?:string; 
  instrutor?:string; 
  assinaturaInstrutor?:string;
  cargaHoraria?:number;
  dataConclusao?:string;
  localidade?:string;
}

export async function gerarPdfCertificado(opts: PdfOptions): Promise<Buffer>{
  console.log(`🎨 [gerarPdfCertificado] Iniciando geração do PDF...`);
  console.log(`   Opções recebidas:`, JSON.stringify(opts, null, 2));
  
  try {
    const doc = new PDFDocument({ 
      size:'A4', 
      layout: 'landscape', // Certificados normalmente são horizontais
      margin: 60 
    });
    
    const chunks: Buffer[] = [];
    doc.on('data', (d: Buffer)=>chunks.push(d));
    doc.on('error', (err: Error) => {
      console.error(`❌ [gerarPdfCertificado] Erro no PDFDocument:`, err);
    });
    
    console.log(`   📄 PDFDocument criado (landscape, A4)`);
    
    // URLs e dados
    const qrData = `https://validar.nextlevel.com.br/cert/${opts.codigoCertificado}?hash=${opts.hashValidacao}`;
    console.log(`   🔗 QR Code URL: ${qrData}`);
    
    const qrPng = await QRCode.toBuffer(qrData, { margin:1, scale:4 });
    console.log(`   ✅ QR Code gerado (${qrPng.length} bytes)`);
    
    const empresa = opts.empresa || 'NextLevel E-Learning';
    const localidade = opts.localidade || 'São Paulo, Brasil';
    const dataConclusao = opts.dataConclusao ? new Date(opts.dataConclusao).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    }) : new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    
    console.log(`   📅 Data formatada: ${dataConclusao}`);
  
  // ========== BORDA DECORATIVA ==========
  doc.lineWidth(3);
  doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke('#4A90E2');
  
  doc.lineWidth(1);
  doc.rect(50, 50, doc.page.width - 100, doc.page.height - 100).stroke('#7CB3E9');
  
  // ========== LOGO / CABEÇALHO ==========
  doc.moveDown(1);
  doc.fontSize(28)
     .fillColor('#2C3E50')
     .font('Helvetica-Bold')
     .text(empresa, { align: 'center' });
  
  doc.fontSize(10)
     .fillColor('#7F8C8D')
     .font('Helvetica')
     .text('Plataforma de Educação Corporativa', { align: 'center' });
  
  // ========== TÍTULO DO CERTIFICADO ==========
  doc.moveDown(1.5);
  doc.fontSize(36)
     .fillColor('#4A90E2')
     .font('Helvetica-Bold')
     .text('CERTIFICADO DE CONCLUSÃO', { align: 'center' });
  
  // Linha decorativa
  const lineY = doc.y + 10;
  doc.moveTo(200, lineY)
     .lineTo(doc.page.width - 200, lineY)
     .lineWidth(2)
     .strokeColor('#4A90E2')
     .stroke();
  
  // ========== CORPO DO CERTIFICADO ==========
  doc.moveDown(2);
  doc.fontSize(14)
     .fillColor('#2C3E50')
     .font('Helvetica')
     .text('Certificamos que', { align: 'center' });
  
  doc.moveDown(0.5);
  doc.fontSize(24)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text(opts.nomeUsuario, { align: 'center', underline: true });
  
  doc.moveDown(1);
  doc.fontSize(14)
     .fillColor('#2C3E50')
     .font('Helvetica')
     .text('concluiu com êxito o curso', { align: 'center' });
  
  doc.moveDown(0.5);
  doc.fontSize(20)
     .fillColor('#4A90E2')
     .font('Helvetica-Bold')
     .text(opts.tituloCurso, { align: 'center' });
  
  // ========== INFORMAÇÕES DO CURSO ==========
  doc.moveDown(1.5);
  const infoY = doc.y;
  const leftX = 120;
  const centerX = doc.page.width / 2;
  const rightX = doc.page.width - 220;
  
  doc.fontSize(11)
     .fillColor('#34495E')
     .font('Helvetica');
  
  // Carga Horária (esquerda)
  if (opts.cargaHoraria) {
    doc.text('Carga Horária:', leftX, infoY, { continued: false, width: 150 });
    doc.font('Helvetica-Bold')
       .text(`${opts.cargaHoraria} horas`, leftX, infoY + 15, { width: 150 });
  }
  
  // Data de Conclusão (centro)
  doc.font('Helvetica')
     .text('Data de Conclusão:', centerX - 75, infoY, { continued: false, width: 150 });
  doc.font('Helvetica-Bold')
     .text(dataConclusao, centerX - 75, infoY + 15, { width: 150, align: 'center' });
  
  // Localidade (direita)
  doc.font('Helvetica')
     .text('Localidade:', rightX, infoY, { continued: false, width: 150 });
  doc.font('Helvetica-Bold')
     .text(localidade, rightX, infoY + 15, { width: 150 });
  
  // ========== QR CODE E AUTENTICAÇÃO ==========
  // Posicionado mais abaixo para não sobrepor a localidade
  const qrX = doc.page.width - 180;
  const qrY = doc.page.height - 180;  // Aumentado de 200 para 180
  doc.image(qrPng, qrX, qrY, { width: 100 });
  
  doc.fontSize(8)
     .fillColor('#7F8C8D')
     .font('Helvetica')
     .text('Autenticação:', qrX, qrY + 105, { width: 100, align: 'center' });
  
  doc.fontSize(7)
     .font('Helvetica-Bold')
     .text(opts.codigoCertificado, qrX, qrY + 118, { width: 100, align: 'center' });
  
  // ========== ASSINATURA ==========
  const sigY = doc.page.height - 150;
  const sigX = 150;
  
  // Linha da assinatura
  doc.moveTo(sigX, sigY)
     .lineTo(sigX + 200, sigY)
     .lineWidth(1)
     .strokeColor('#2C3E50')
     .stroke();
  
  doc.moveDown(8);
  doc.fontSize(12)
     .fillColor('#2C3E50')
     .font('Helvetica-Bold')
     .text(opts.instrutor || 'Instrutor Responsável', sigX, sigY + 10, { width: 200, align: 'center' });
  
  doc.fontSize(9)
     .fillColor('#7F8C8D')
     .font('Helvetica-Oblique')
     .text('Instrutor(a) do Curso', sigX, sigY + 28, { width: 200, align: 'center' });
  
  // ========== RODAPÉ COM HASH ==========
  doc.fontSize(7)
     .fillColor('#95A5A6')
     .font('Helvetica')
     .text(
       `Certificado gerado digitalmente e autenticado via blockchain. Hash de validação: ${opts.hashValidacao.slice(0, 32)}...`, 
       80, 
       doc.page.height - 50, 
       { width: doc.page.width - 300, align: 'left' }
     );
  
  doc.fontSize(7)
     .text(
       `Este documento pode ser validado em: https://validar.nextlevel.com.br`, 
       80, 
       doc.page.height - 35, 
       { width: doc.page.width - 160, align: 'left' }
     );
  
  console.log(`   ✍️ Finalizando documento PDF...`);
  doc.end();
  await new Promise(r=>doc.on('end', r));
  
  const finalBuffer = Buffer.concat(chunks);
  console.log(`   ✅ PDF gerado com sucesso! Tamanho final: ${finalBuffer.length} bytes`);
  
  return finalBuffer;
  } catch (error) {
    console.error(`❌ [gerarPdfCertificado] ERRO ao gerar PDF:`, error);
    throw error;
  }
}