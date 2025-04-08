import React, { useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { ReportData } from '@/types';
import { reportToHtml } from '@/utils/report';

interface ReportViewerProps {
  report: ReportData;
  onImageGenerated: (dataUrl: string, code: string) => void;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ report, onImageGenerated }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reportRef.current && report) {
      // 잠시 기다려 DOM이 완전히 렌더링 되도록 함
      const timer = setTimeout(() => {
        toPng(reportRef.current!, { quality: 0.95 })
          .then((dataUrl) => {
            onImageGenerated(dataUrl, report.code);
          })
          .catch((error) => {
            console.error('리포트 이미지 생성 오류:', error);
          });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [report, onImageGenerated]);

  // 실제 UI에서는 렌더링하지 않고 숨김 처리
  // 단, 이미지 생성을 위해 DOM에는 존재해야 함
  return (
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      <div
        ref={reportRef}
        className="report-container"
        dangerouslySetInnerHTML={{ __html: reportToHtml(report) }}
      />
    </div>
  );
};

export default ReportViewer; 