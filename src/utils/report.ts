import { format } from 'date-fns';
import { ReportData } from '@/types';

// 리포트 코드 생성 함수
export const generateReportCode = (): string => {
  const prefix = 'SSY-';
  const date = format(new Date(), 'yyyyMMdd-HHmmss');
  return `${prefix}${date}`;
};

// 리포트 데이터를 HTML로 변환
export const reportToHtml = (report: ReportData): string => {
  const defaultText = '(내용이 생성되지 않았습니다. 대화가 충분하지 않을 수 있습니다.)';
  
  return `
    <div class="report-container" style="font-family: 'Consolas', 'Monaco', monospace; padding: 30px; background-color: #f8f9fa; max-width: 800px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 10px;">[MEMORY FLOW REPORT]</h1>
        <div style="background-color: #e6f2ff; color: #0066cc; font-size: 18px; font-weight: bold; padding: 8px; border-radius: 5px; display: inline-block;">${report.code}</div>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">1. FLOW:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.flow || defaultText}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">2. CORE EXPRESSIONS:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.coreExpressions || defaultText}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">3. EMOTIONAL SEQUENCE:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.emotionalSequence || defaultText}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">4. RESTORATION TRIGGER:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.restorationTrigger || defaultText}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">5. RETRIEVAL INSTRUCTION:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.retrievalInstruction || defaultText}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">6. CONTEXT TIMESTAMP:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.contextTimestamp || report.code}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">7. FEEDBACK SIGNAL:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.feedbackSignal || defaultText}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">8. RESPONSE STYLE SUGGESTION:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.responseStyleSuggestion || defaultText}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">9. USER STYLE INDICATOR:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.userStyleIndicator || defaultText}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">10. NEXT MEMORY LABEL:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.nextMemoryLabel || defaultText}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">11. CONTINUATION CONTEXT:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.continuationContext || defaultText}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">12. CONTEXT VARIATION HINT:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.contextVariationHint || defaultText}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">13. AI SELF-MODULATION TIP:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.aiSelfModulationTip || defaultText}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">14. RESPONSE DIRECTION OPTIONS:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.responseDirectionOptions || defaultText}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">15. REPORT GENERATED USING:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.reportGenerated || 'RecallKey v1.0'}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444; font-size: 16px; margin-bottom: 8px;">16. NOTE:</h3>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${report.note || '이 리콜키는 대화의 연속성을 위해 설계되었습니다. 코드를 이용해 대화를 복원할 수 있습니다.'}</p>
      </div>
      
      <div class="footer" style="text-align: center; margin-top: 30px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; font-size: 0.9em;">
        <p>리콜키 코드: <strong style="color: #0066cc;">${report.code}</strong> — RecallKey v1.0</p>
      </div>
    </div>
  `;
}; 