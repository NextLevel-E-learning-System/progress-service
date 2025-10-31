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
    
    // Data de emissão do certificado (data atual)
    const dataEmissao = new Date();
    const cidade = localidade.split(',')[0].trim() || 'Curitiba';
    const diaEmissao = dataEmissao.getDate();
    const mesEmissao = dataEmissao.toLocaleDateString('pt-BR', { month: 'long' });
    const anoEmissao = dataEmissao.getFullYear();
    const dataEmissaoFormatada = `${cidade}, ${diaEmissao} de ${mesEmissao} de ${anoEmissao}`;
    
    console.log(`   📅 Data conclusão formatada: ${dataConclusao}`);
    console.log(`   📅 Data emissão formatada: ${dataEmissaoFormatada}`);
  
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
  
  
  // ========== TÍTULO DO CERTIFICADO ==========
  doc.moveDown(1);
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
  
  // Texto do certificado em uma linha fluída com negrito apenas nas informações
  const textoInicio = 'Certificamos que ';
  const textoMeio = ' concluiu o curso ';
  const textoFim = opts.cargaHoraria 
    ? `, com carga horária de ` 
    : ' no dia ';
  const textoData = ` horas no dia `;
  
  // Calcular largura do texto
  const margemLateral = 80;
  const larguraDisponivel = doc.page.width - (margemLateral * 2);
  
  // Usar fontSize para calcular posição Y atual
  const currentY = doc.y;
  
  doc.fontSize(14)
     .fillColor('#2C3E50')
     .font('Helvetica')
     .text(textoInicio, margemLateral, currentY, { 
       continued: true, 
       width: larguraDisponivel,
       lineBreak: false
     });
  
  doc.font('Helvetica-Bold')
     .fillColor('#000000')
     .text(opts.nomeUsuario.toUpperCase(), { continued: true, lineBreak: false });
  
  doc.font('Helvetica')
     .fillColor('#2C3E50')
     .text(textoMeio, { continued: true, lineBreak: false });
  
  doc.font('Helvetica-Bold')
     .fillColor('#4A90E2')
     .text(opts.tituloCurso, { continued: true, lineBreak: false });
  
  if (opts.cargaHoraria) {
    doc.font('Helvetica')
       .fillColor('#2C3E50')
       .text(textoFim, { continued: true, lineBreak: false });
    
    doc.font('Helvetica-Bold')
       .fillColor('#000000')
       .text(opts.cargaHoraria.toString(), { continued: true, lineBreak: false });
    
    doc.font('Helvetica')
       .fillColor('#2C3E50')
       .text(textoData, { continued: true, lineBreak: false });
    
    doc.font('Helvetica-Bold')
       .fillColor('#000000')
       .text(dataConclusao, { continued: false });
  } else {
    doc.font('Helvetica')
       .fillColor('#2C3E50')
       .text(textoFim, { continued: true, lineBreak: false });
    
    doc.font('Helvetica-Bold')
       .fillColor('#000000')
       .text(dataConclusao, { continued: false });
  }
  
  doc.moveDown(2);
  

  // ========== DATA DE EMISSÃO (CENTRALIZADA E ACIMA) ==========
  doc.fontSize(12)
     .fillColor('#2C3E50')
     .font('Helvetica-Bold')
     .text(dataEmissaoFormatada, { align: 'center' });
  
  doc.moveDown(3);
  
  // ========== LINHA COM INSTRUTOR E QR CODE ==========
  const baseY = doc.page.height - 160;
  
  // INSTRUTOR (esquerda)
  const sigX = 120;
  const sigWidth = 250;
  
  doc.fontSize(14)
     .fillColor('#2C3E50')
     .font('Helvetica-Bold')
     .text(opts.instrutor || 'Instrutor Responsável', sigX, baseY, { width: sigWidth, align: 'center' });
  
  doc.fontSize(10)
     .fillColor('#7F8C8D')
     .font('Helvetica')
     .text('INSTRUTOR', sigX, baseY + 20, { width: sigWidth, align: 'center' });
  
  // QR CODE (direita)
  const qrX = doc.page.width - 200;
  const qrSize = 100;
  
  doc.image(qrPng, qrX, baseY - 20, { width: qrSize });
  
  doc.fontSize(8)
     .fillColor('#7F8C8D')
     .font('Helvetica')
     .text('Autenticação:', qrX, baseY + qrSize - 15, { width: qrSize, align: 'center' });
  
  doc.fontSize(7)
     .font('Helvetica-Bold')
     .text(opts.codigoCertificado, qrX, baseY + qrSize - 2, { width: qrSize, align: 'center' });
  
  // ========== RODAPÉ COM HASH ==========
  doc.fontSize(7)
     .fillColor('#95A5A6')
     .font('Helvetica')
     .text(
       `Certificado gerado digitalmente e autenticado via blockchain. Hash de validação: ${opts.hashValidacao.slice(0, 32)}...`, 
       80, 
       { width: doc.page.width - 300, align: 'left' }
     );
  
  doc.fontSize(7)
     .text(
       `Este documento pode ser validado em: https://validar.nextlevel.com.br`, 
       80, 
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