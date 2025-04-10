import { NextResponse } from 'next/server';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// 이미지 업로드 API
export async function POST(req: Request) {
  try {
    const { dataUrl, code } = await req.json();
    
    if (!dataUrl || !code) {
      return NextResponse.json(
        { error: '데이터 URL과 코드가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 이미지 경로 설정
    const imageRef = ref(storage, `reports/${code}.png`);
    
    // Base64 데이터 URL을 Firebase Storage에 업로드
    const snapshot = await uploadString(imageRef, dataUrl, 'data_url');
    
    // 업로드된 이미지의 다운로드 URL 가져오기
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    return NextResponse.json({ url: downloadUrl });
  } catch (error: Error | unknown) {
    console.error('이미지 업로드 오류:', error);
    return NextResponse.json(
      { error: '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 이미지 URL 가져오기 API
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: '코드가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // URL 형식인 경우 처리
    let cleanCode = code;
    if (code.includes('firebasestorage.googleapis.com') && code.includes('/reports/')) {
      const codeMatch = code.match(/\/reports(?:\%2F|\/)([^\/\?]+)\.png/);
      if (codeMatch) {
        cleanCode = decodeURIComponent(codeMatch[1]);
      } else {
        return NextResponse.json(
          { error: '유효하지 않은 URL 형식입니다.' },
          { status: 400 }
        );
      }
    }
    
    console.log('Cleaned code for Firebase lookup:', cleanCode);
    const imageRef = ref(storage, `reports/${cleanCode}.png`);
    
    try {
      const downloadUrl = await getDownloadURL(imageRef);
      
      // 이미지 URL만 반환
      return NextResponse.json({ 
        url: downloadUrl,
        code: cleanCode
      });
    } catch (error) {
      // getDownloadURL 실패 시 로그 찍고 404 반환
      console.error('이미지 URL 가져오기 오류:', error);
      return NextResponse.json(
        { error: '이미지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    console.error('이미지 URL 가져오기 오류:', error);
    return NextResponse.json(
      { error: '이미지를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }
} 