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
  const titleY = doc.y;
  console.log(`   📍 titleY após título: ${titleY}`);
  const lineY = titleY + 10;
  console.log(`   📍 lineY: ${lineY}`);
  doc.moveTo(200, lineY)
     .lineTo(doc.page.width - 200, lineY)
     .lineWidth(2)
     .strokeColor('#4A90E2')
     .stroke();
  
  // ========== CORPO DO CERTIFICADO ==========
  // Definir posição Y manualmente após a linha
  const bodyY = lineY + 40;
  console.log(`   📍 bodyY: ${bodyY}`);
  
  // Texto do certificado com variáveis em negrito
  const margemLateral = 90;
  const larguraDisponivel = doc.page.width - (margemLateral * 2);
  console.log(`   📍 larguraDisponivel: ${larguraDisponivel}`);
  
  doc.fontSize(14)
     .fillColor('#2C3E50');
  
  // Texto com partes em negrito
  doc.font('Helvetica')
     .text('Certificamos que ', margemLateral, bodyY, { 
       width: larguraDisponivel,
       align: 'justify',
       continued: true
     })
     .font('Helvetica-Bold')
     .text(opts.nomeUsuario.toUpperCase(), { continued: true })
     .font('Helvetica')
     .text(' concluiu o curso ', { continued: true })
     .font('Helvetica-Bold')
     .text(opts.tituloCurso, { continued: true });
  
  if (opts.cargaHoraria) {
    doc.font('Helvetica')
       .text(', com carga horária de ', { continued: true })
       .font('Helvetica-Bold')
       .text(`${opts.cargaHoraria} horas `, { continued: true })
       .font('Helvetica')
       .text('no dia ', { continued: true })
       .font('Helvetica-Bold')
       .text(`${dataConclusao}.`, { continued: false });
  } else {
    doc.font('Helvetica')
       .text(' no dia ', { continued: true })
       .font('Helvetica-Bold')
       .text(`${dataConclusao}.`, { continued: false });
  }
  
  // ========== DATA DE EMISSÃO (CENTRALIZADA E ACIMA) ==========
  const dataEmissaoY = bodyY + 80; // Posição fixa abaixo do corpo
  console.log('📍 dataEmissaoY:', dataEmissaoY);
  
  doc.fontSize(12)
     .fillColor('#2C3E50')
     .font('Helvetica-Bold')
     .text(dataEmissaoFormatada, margemLateral, dataEmissaoY, { 
       width: larguraDisponivel, 
       align: 'center' 
     });
  
  // ========== LINHA COM INSTRUTOR E QR CODE ==========
  const baseY = doc.page.height - 190;
  console.log('📍 baseY (instrutor/QR):', baseY);
  
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
  
  // ========== RODAPÉ COM HASH (UMA ÚNICA LINHA) ==========
  const rodapeY = doc.page.height - 30;
  console.log('📍 rodapeY:', rodapeY);
  
  const textoRodape = `Certificado gerado digitalmente. Hash: ${opts.hashValidacao.slice(0, 20)}... | Validar em: https://validar.nextlevel.com.br`;
  
  doc.fontSize(7)
     .fillColor('#95A5A6')
     .font('Helvetica')
     .text(
       textoRodape, 
       80,
       rodapeY,
       { width: doc.page.width - 160, align: 'center' }
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