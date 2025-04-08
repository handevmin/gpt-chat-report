import { format } from 'date-fns';
import { ReportData } from '@/types';

// 리포트 코드 생성 함수
export const generateReportCode = (): string => {
  const prefix = 'EMV-';
  const date = format(new Date(), 'yyyyMMdd-HHmmss');
  return `${prefix}${date}`;
};

// 리포트 데이터를 HTML로 변환
export const reportToHtml = (report: ReportData): string => {
  return `
    <div class="report-container" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; max-width: 800px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
      <h1 style="color: #333; text-align: center;">[PORTABLE CONTEXT LAYER REPORT]</h1>
      <h2 style="color: #555; text-align: center;">CODE: ${report.code}</h2>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">1. FLOW:</h3>
        <p style="color: #666; line-height: 1.6;">${report.flow}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">2. CORE EXPRESSIONS:</h3>
        <p style="color: #666; line-height: 1.6;">${report.coreExpressions}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">3. EMOTIONAL SEQUENCE:</h3>
        <p style="color: #666; line-height: 1.6;">${report.emotionalSequence}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">4. RESTORATION TRIGGER:</h3>
        <p style="color: #666; line-height: 1.6;">${report.restorationTrigger}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">5. RETRIEVAL INSTRUCTION:</h3>
        <p style="color: #666; line-height: 1.6;">${report.retrievalInstruction}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">6. CONTEXT TIMESTAMP:</h3>
        <p style="color: #666; line-height: 1.6;">${report.contextTimestamp}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">7. FEEDBACK SIGNAL:</h3>
        <p style="color: #666; line-height: 1.6;">${report.feedbackSignal}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">8. RESPONSE STYLE SUGGESTION:</h3>
        <p style="color: #666; line-height: 1.6;">${report.responseStyleSuggestion}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">9. USER STYLE INDICATOR:</h3>
        <p style="color: #666; line-height: 1.6;">${report.userStyleIndicator}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">10. NEXT MEMORY LABEL:</h3>
        <p style="color: #666; line-height: 1.6;">${report.nextMemoryLabel}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">11. CONTINUATION CONTEXT:</h3>
        <p style="color: #666; line-height: 1.6;">${report.continuationContext}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">12. CONTEXT VARIATION HINT:</h3>
        <p style="color: #666; line-height: 1.6;">${report.contextVariationHint}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">13. AI SELF-MODULATION TIP:</h3>
        <p style="color: #666; line-height: 1.6;">${report.aiSelfModulationTip}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">15. RESPONSE DIRECTION OPTIONS:</h3>
        <p style="color: #666; line-height: 1.6;">${report.responseDirectionOptions}</p>
      </div>
      
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #444;">16. REPORT GENERATED USING:</h3>
        <p style="color: #666; line-height: 1.6;">${report.reportGenerated}</p>
      </div>
      
      <div class="footer" style="text-align: center; margin-top: 30px; color: #888; font-size: 0.8em;">
        <p>END OF CONTEXT</p>
      </div>
    </div>
  `;
}; 