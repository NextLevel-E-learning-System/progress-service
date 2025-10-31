// Script para testar geração de certificado PDF localmente
import { gerarPdfCertificado } from './dist/utils/certificatePdf.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCertificate() {
  console.log('🎨 Gerando certificado de teste...\n');

  const opcoesPdf = {
    tituloCurso: 'Teste 3',
    nomeUsuario: 'Patricia Teste',
    codigoCertificado: 'TEST12345678',
    hashValidacao: '6998b20fbfcc8cf41936983d20b3ad33381eea90efe542dbe67c7725966971b1',
    empresa: 'NextLevel E-Learning',
    instrutor: 'Professor NextLevel',
    cargaHoraria: 5,
    dataConclusao: '2025-10-30T06:57:26.000Z',
    localidade: 'Curitiba'
  };

  try {
    console.log('📋 Opções:', JSON.stringify(opcoesPdf, null, 2));
    
    const pdfBuffer = await gerarPdfCertificado(opcoesPdf);
    
    const outputPath = path.join(__dirname, 'certificado-teste.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log('\n✅ PDF gerado com sucesso!');
    console.log(`📁 Arquivo salvo em: ${outputPath}`);
    console.log(`📊 Tamanho: ${pdfBuffer.length} bytes`);
    console.log('\n💡 Abra o arquivo para visualizar o certificado!');
    
    // Tentar abrir o PDF automaticamente (Windows)
    const { exec } = await import('child_process');
    exec(`start "" "${outputPath}"`, (error) => {
      if (error) {
        console.log('⚠️ Não foi possível abrir o PDF automaticamente.');
        console.log('   Abra manualmente o arquivo:', outputPath);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao gerar certificado:', error);
    process.exit(1);
  }
}

testCertificate();
