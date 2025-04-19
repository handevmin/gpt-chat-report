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
    
    // 유효한 SSY 코드 형식 확인
    if(!code.match(/^SSY-\d{8}-\d{6}$/)) {
      return NextResponse.json(
        { error: '유효하지 않은 코드 형식입니다. SSY-YYYYMMDD-HHMMSS 형식이어야 합니다.' },
        { status: 400 }
      );
    }
    
    // 이미지 경로 설정
    const imageRef = ref(storage, `reports/${code}.png`);
    
    // Base64 데이터 URL을 Firebase Storage에 업로드
    await uploadString(imageRef, dataUrl, 'data_url');
    
    // 코드 반환
    return NextResponse.json({ 
      success: true,
      code: code
    });
  } catch (error: Error | unknown) {
    console.error('이미지 업로드 오류:', error);
    return NextResponse.json(
      { error: '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 코드 유효성 확인 API
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
    
    // 유효한 SSY 코드 형식 확인
    if(!code.match(/^SSY-\d{8}-\d{6}$/)) {
      return NextResponse.json(
        { error: '유효하지 않은 코드 형식입니다. SSY-YYYYMMDD-HHMMSS 형식이어야 합니다.' },
        { status: 400 }
      );
    }
    
    console.log('코드 유효성 확인:', code);
    const imageRef = ref(storage, `reports/${code}.png`);
    
    try {
      // 이미지 URL 가져오기
      const imageUrl = await getDownloadURL(imageRef);
      
      // 코드가 유효함을 반환하며 이미지 URL도 포함
      return NextResponse.json({ 
        success: true,
        code: code,
        imageUrl: imageUrl
      });
    } catch (error) {
      // 이미지가 존재하지 않는 경우
      console.error('코드 확인 오류:', error);
      return NextResponse.json(
        { error: '유효하지 않은 코드입니다.' },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    console.error('코드 처리 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 