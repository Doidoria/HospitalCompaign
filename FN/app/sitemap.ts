// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://wellcommunity-yescare.co.kr';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0, // 메인 페이지
    },
    {
      url: `${baseUrl}/guide`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9, // 서비스 이용 안내
    },
    {
      url: `${baseUrl}/apply`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9, // 동행 신청
    },
    {
      url: `${baseUrl}/education`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8, // 교육원 안내
    },
    {
      url: `${baseUrl}/education/apply`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7, // 교육 신청
    },
    {
      url: `${baseUrl}/review`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8, // 고객 후기
    },
    {
      url: `${baseUrl}/support/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6, // 자주 묻는 질문
    },
    {
      url: `${baseUrl}/support/notice`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6, // 공지사항
    },
    {
      url: `${baseUrl}/support/inquiry`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5, // 1:1 문의
    },
    {
      url: `${baseUrl}/policy/manager-protection`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4, // 매니저 보호 및 규정
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3, // 개인정보 처리방침
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3, // 이용약관
    },
  ];
}