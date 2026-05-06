'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageCircleHeart, Loader2 } from 'lucide-react';
import { reviewApi } from '@/src/api/index';
import dayjs from 'dayjs';

interface Review {
  id: number;
  reservationId: number;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reviewApi.getReviews(0, 50)
      .then(res => {
        setReviews(res.data.content || res.data); 
      })
      .catch(err => console.error("리뷰 로딩 실패:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const maskName = (name: string) => {
    if (!name || name.length < 2) return name;
    if (name.length === 2) return name[0] + '*';
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <section className="bg-blue-950 text-white py-16 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center justify-center bg-blue-900/50 p-3 rounded-2xl mb-2">
            <MessageCircleHeart className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">생생한 이용 후기</h2>
          <p className="text-blue-200 text-lg">예스케어와 함께한 고객님들의 따뜻한 이야기입니다.</p>
        </motion.div>
      </section>

      <main className="max-w-4xl mx-auto px-6 pt-12">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-3xl shadow-sm border border-gray-100">
            아직 작성된 후기가 없습니다. 첫 후기의 주인공이 되어주세요!
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review, idx) => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-5 h-5 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                      {maskName(review.authorName)} <span className="text-gray-400 font-normal ml-1">보호자님</span>
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">{dayjs(review.createdAt).format('YYYY.MM.DD')}</span>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{review.comment}</p>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}